// app.js - Logic ứng dụng (API version)

// ================ DOM Elements ================
const DOM = {
  projectsTableBody: document.getElementById("projectsTableBody"),
  tableFooter: document.getElementById("tableFooter"),

  // KPI Cards
  totalProjectsCard: document.querySelector("#totalProjectsCard .text-3xl"),
  totalContractValueCard: document.querySelector(
    "#totalContractValueCard .text-3xl"
  ),
  totalCollectedCard: document.querySelector("#totalCollectedCard .text-3xl"),
  totalRemainingCard: document.querySelector("#totalRemainingCard .text-3xl"),

  // Percentage elements
  collectedPercentage: document.getElementById("collectedPercentage"),
  remainingPercentage: document.getElementById("remainingPercentage"),
};

// ================ Configuration ================
const API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  ENDPOINTS: {
    PROJECTS: "/api/projects",
  },
};

// ================ API Functions ================

/**
 * Fetch data từ API
 */
async function fetchProjectsFromAPI() {
  try {
    showLoadingState(true);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROJECTS}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();

    // Transform data từ API sang định dạng frontend
    const transformedProjects = transformAPIData(projects);

    return transformedProjects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    showErrorState(error.message);
    return [];
  } finally {
    showLoadingState(false);
  }
}

/**
 * Transform data từ API sang định dạng frontend
 */
function transformAPIData(apiProjects) {
  return apiProjects.map((project) => {
    // Tính tổng đã thu từ payments
    const collected = project.payments
      .filter((p) => p.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Tính còn lại
    const remaining = Math.max(0, project.contractValue - collected);

    // Map status
    const statusMap = {
      planning: "pending",
      in_progress: "active",
      completed: "completed",
      cancelled: "cancelled",
    };

    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    };

    console.log(project);

    return {
      id: project._id,
      code: project.projectCode,
      name: project.name,
      location: project.location,
      investor: project.investor,
      status: statusMap[project.status] || "pending",
      contractValue: project.contractValue,
      collected: collected,
      remaining: remaining,
      capacity: project.capacity || 0,
      progress: project.progress || 0,
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      // Giữ nguyên payments để trang chi tiết sử dụng
      payments: project.payments || [],
    };
  });
}

// ================ Utility Functions ================

/**
 * Format số tiền VNĐ
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Format số tiền với đơn vị (Tỷ/Triệu)
 */
function formatCurrencyWithUnit(amount) {
  if (amount >= 1000000000) {
    const billions = (amount / 1000000000).toFixed(2);
    return `${billions} Tỷ`;
  } else if (amount >= 1000000) {
    const millions = (amount / 1000000).toFixed(2);
    return `${millions} Triệu`;
  } else {
    return formatCurrency(amount);
  }
}

/**
 * Tính tỷ lệ phần trăm
 */
function calculatePercentage(part, total) {
  if (total === 0) return 0;
  return ((part / total) * 100).toFixed(1);
}

/**
 * Tính tổng các KPI
 */
function calculateKPIs(projects) {
  const totalProjects = projects.length;
  const totalContractValue = projects.reduce(
    (sum, project) => sum + project.contractValue,
    0
  );
  const totalCollected = projects.reduce(
    (sum, project) => sum + project.collected,
    0
  );
  const totalRemaining = Math.max(0, totalContractValue - totalCollected);

  // Tính phần trăm
  const collectedPercentage = calculatePercentage(
    totalCollected,
    totalContractValue
  );
  const remainingPercentage = calculatePercentage(
    totalRemaining,
    totalContractValue
  );

  return {
    totalProjects,
    totalContractValue,
    totalCollected,
    totalRemaining,
    collectedPercentage,
    remainingPercentage,
  };
}

// ================ Business Logic ================

/**
 * Tính toán và cập nhật KPI
 */
function updateKPIStats(projects) {
  const kpis = calculateKPIs(projects);

  // Cập nhật DOM
  DOM.totalProjectsCard.textContent = kpis.totalProjects;
  DOM.totalContractValueCard.textContent = formatCurrencyWithUnit(
    kpis.totalContractValue
  );
  DOM.totalCollectedCard.textContent = formatCurrencyWithUnit(
    kpis.totalCollected
  );
  DOM.totalRemainingCard.textContent = formatCurrencyWithUnit(
    kpis.totalRemaining
  );

  // Cập nhật phần trăm
  DOM.collectedPercentage.textContent = `${kpis.collectedPercentage}% so với tổng HĐ`;
  DOM.remainingPercentage.textContent = `${kpis.remainingPercentage}% so với tổng HĐ`;
}

/**
 * Render dòng dự án với cột công suất mới
 */
function renderProjectRow(project) {
  const collectedPercent = calculatePercentage(
    project.collected,
    project.contractValue
  );
  const remainingPercent = calculatePercentage(
    project.remaining,
    project.contractValue
  );

  return `
      <tr 
        class="group hover:bg-slate-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer project-row"
        data-project-id="${project.id}"
        onclick="handleProjectClick('${project.id}')"
      >
        <!-- Tên dự án và địa chỉ -->
        <td class="py-4 px-6">
          <div class="flex flex-col min-w-[220px] max-w-[320px]">
            <!-- Tên dự án - 1 dòng -->
            <span class="text-sm font-bold text-text-main dark:text-white group-hover:text-primary transition-colors duration-200 mb-1 truncate" title="${
              project.name
            }">
              ${project.name}
            </span>
            <!-- Địa chỉ - 2 dòng với ellipsis -->
            <span class="text-xs text-text-secondary group-hover:text-primary/80 transition-colors duration-200 line-clamp-2 leading-snug break-words" title="${
              project.location
            }">
              ${project.location}
            </span>
          </div>
        </td>
        
        <!-- Chủ đầu tư -->
        <td class="py-4 px-6">
          <div class="flex flex-col min-w-[220px] max-w-[320px]">
            <div class="flex items-start gap-2">
              <!-- Avatar chữ cái đầu -->
              <div class="size-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/30 transition-all duration-200 flex-shrink-0 mt-0.5">
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${project.investor.charAt(
                  0
                )}</span>
              </div>
              <!-- Tên chủ đầu tư - 2 dòng -->
              <div class="min-w-0 flex-1">
                <div class="text-sm text-text-main dark:text-white group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug break-words" title="${
                  project.investor
                }">
                  ${project.investor}
                </div>
              </div>
            </div>
          </div>
        </td>
        
        <!-- Công suất -->
        <td class="py-4 px-6 text-sm font-bold text-text-main dark:text-white text-right whitespace-nowrap group-hover:text-primary transition-colors duration-200">
          ${project.capacity.toFixed(1)} MWp
        </td>
        
        <!-- Giá trị HĐ -->
        <td class="py-4 px-6 text-sm font-bold text-text-main dark:text-white text-right whitespace-nowrap group-hover:text-primary transition-colors duration-200">
          ${formatCurrency(project.contractValue)}
        </td>
        
        <!-- Đã thu -->
        <td class="py-4 px-6 text-right whitespace-nowrap">
          <div class="flex flex-col items-end">
            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">
              ${formatCurrency(project.collected)}
            </span>
            <span class="text-xs text-text-secondary group-hover:text-primary/80 transition-colors duration-200">
              ${collectedPercent}%
            </span>
          </div>
        </td>
        
        <!-- Chưa thu -->
        <td class="py-4 px-6 text-right whitespace-nowrap">
          <div class="flex flex-col items-end">
            <span class="text-sm font-bold ${
              project.remaining > 0
                ? "text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300"
                : "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
            } transition-colors duration-200">
              ${formatCurrency(project.remaining)}
            </span>
            <span class="text-xs text-text-secondary group-hover:text-primary/80 transition-colors duration-200">
              ${remainingPercent}%
            </span>
          </div>
        </td>
      </tr>
    `;
}

/**
 * Xử lý click vào dự án
 */
function handleProjectClick(projectId) {
  // Thêm hiệu ứng click
  const row = document.querySelector(`[data-project-id="${projectId}"]`);
  if (row) {
    row.style.transform = "scale(0.99)";
    row.style.transition = "transform 0.1s";

    setTimeout(() => {
      row.style.transform = "";

      // Hiển thị loading
      showLoading();

      // Chuyển trang sau 300ms
      setTimeout(() => {
        goToProjectDetail(projectId);
      }, 300);
    }, 100);
  }
}

/**
 * Chuyển đến trang chi tiết dự án
 */
function goToProjectDetail(projectId) {
  // Lưu projectId vào localStorage để trang chi tiết có thể lấy
  localStorage.setItem("selectedProjectId", projectId);

  // Chuyển đến trang chi tiết
  window.location.href = "project-detail/";
}

/**
 * Hiển thị loading
 */
function showLoading() {
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loadingOverlay";
  loadingDiv.className =
    "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  loadingDiv.innerHTML = `
      <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl shadow-lg">
        <div class="flex flex-col items-center gap-3">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p class="text-text-main dark:text-white">Đang tải chi tiết dự án...</p>
        </div>
      </div>
    `;
  document.body.appendChild(loadingDiv);
}

/**
 * Render bảng dự án
 */
function renderProjectsTable(projects) {
  const tableBody = DOM.projectsTableBody;
  const tableFooter = DOM.tableFooter;

  if (projects.length === 0) {
    tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-text-secondary dark:text-gray-400">
            <div class="flex flex-col items-center gap-3">
              <span class="material-symbols-outlined text-5xl">search_off</span>
              <p class="font-medium text-lg">Không có dữ liệu dự án</p>
              <p class="text-sm">API không trả về dữ liệu hoặc có lỗi kết nối</p>
              <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                Thử lại
              </button>
            </div>
          </td>
        </tr>
      `;
  } else {
    tableBody.innerHTML = projects
      .map((project) => renderProjectRow(project))
      .join("");
  }

  // Footer chỉ hiển thị tổng số dự án
  tableFooter.textContent = `Tổng cộng: ${projects.length} dự án`;
}

/**
 * Hiển thị trạng thái loading
 */
function showLoadingState(isLoading) {
  if (isLoading) {
    DOM.tableFooter.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Đang tải dữ liệu từ API...
        </div>
      `;
  }
}

/**
 * Hiển thị trạng thái lỗi
 */
function showErrorState(errorMessage) {
  DOM.tableFooter.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
          <span class="material-symbols-outlined text-lg">error</span>
          <span>Lỗi kết nối API</span>
        </div>
        <p class="text-xs text-text-secondary dark:text-gray-400">${
          errorMessage || "Không thể kết nối đến server"
        }</p>
        <button onclick="initApp()" class="mt-1 px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded text-xs font-medium transition-colors w-fit">
          Thử lại
        </button>
      </div>
    `;
}

// ================ Initialization ================

/**
 * Khởi tạo ứng dụng
 */
async function initApp() {
  try {
    console.log("Đang tải dữ liệu từ API...");

    // Fetch data từ API
    const projects = await fetchProjectsFromAPI();

    if (projects.length > 0) {
      // Render dữ liệu
      updateKPIStats(projects);
      renderProjectsTable(projects);

      console.log("Ứng dụng Quản lý Dự án đã được khởi chạy!");
      console.log(`Đã tải ${projects.length} dự án từ API`);

      // Log KPI tổng hợp
      const kpis = calculateKPIs(projects);
      console.log("Tổng hợp KPI từ API:");
      console.log("- Tổng số dự án:", kpis.totalProjects);
      console.log(
        "- Tổng giá trị HĐ:",
        formatCurrency(kpis.totalContractValue),
        "VNĐ"
      );
      console.log(
        "- Tổng đã thu:",
        formatCurrency(kpis.totalCollected),
        `VNĐ (${kpis.collectedPercentage}%)`
      );
      console.log(
        "- Tổng chưa thu:",
        formatCurrency(kpis.totalRemaining),
        `VNĐ (${kpis.remainingPercentage}%)`
      );
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo ứng dụng:", error);
  }
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
