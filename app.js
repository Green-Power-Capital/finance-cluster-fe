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
  totalContractNumberValueCard: document.querySelector(
    "#totalContractValueCard .value"
  ),
  totalCollectedCard: document.querySelector("#totalCollectedCard .text-3xl"),
  totalRemainingCard: document.querySelector("#totalRemainingCard .text-3xl"),

  // Percentage elements
  collectedPercentage: document.getElementById("collectedPercentage"),
  remainingPercentage: document.getElementById("remainingPercentage"),

  // 3 ô mới - THÊM KIỂM TRA TỒN TẠI
  totalToanThanhSpentValue: document.getElementById("totalToanThanhSpentValue"),
  totalToanThanhSpentDetail: document.getElementById(
    "totalToanThanhSpentDetail"
  ),

  totalLamVuTransferredValue: document.getElementById(
    "totalLamVuTransferredValue"
  ),
  totalLamVuTransferredDetail: document.getElementById(
    "totalLamVuTransferredDetail"
  ),

  totalLamVuRemainingValue: document.getElementById("totalLamVuRemainingValue"),
  totalLamVuRemainingDetail: document.getElementById(
    "totalLamVuRemainingDetail"
  ),

  // Thêm các card elements
  totalToanThanhSpentCard: document.getElementById("totalToanThanhSpentCard"),
  totalLamVuTransferredCard: document.getElementById(
    "totalLamVuTransferredCard"
  ),
  totalLamVuRemainingCard: document.getElementById("totalLamVuRemainingCard"),
};

// ================ Configuration ================
const API_CONFIG = {
  //   BASE_URL: "http://localhost:3000",
  BASE_URL: "https://finance-cluster-be.onrender.com",
  ENDPOINTS: {
    PROJECTS: "/api/projects",
    // API mới cho 3 ô thống kê
    CONTRACTS_BUYER:
      "/api/contracts/buyer/64a1b2c3d4e5f67890123456?sortOrder=1",
    TRANSACTIONS_COMPANY: "/api/transactions/company/64a1b2c3d4e5f67890123456",
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
 * Fetch tổng tiền Toàn Thành đã chi từ API contracts
 */
async function fetchTotalToanThanhSpent() {
  try {
    console.log("Fetching Toan Thanh spent data...");
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTRACTS_BUYER}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contracts = await response.json();

    // Tính tổng số tiền đã chi từ tất cả hợp đồng
    // Duyệt qua từng contract -> duyệt qua payments -> cộng các payment có status = 'paid'
    let totalSpent = 0;

    contracts.forEach((contract) => {
      if (contract.payments && Array.isArray(contract.payments)) {
        const paidAmount = contract.payments
          .filter((p) => p.status === "paid")
          .reduce((sum, payment) => sum + payment.amount, 0);
        totalSpent += paidAmount;
      }
    });

    console.log(`Toàn Thành đã chi: ${formatCurrency(totalSpent)} VNĐ`);
    return totalSpent;
  } catch (error) {
    console.error("Error fetching Toan Thanh spent data:", error);
    return 0;
  }
}

/**
 * Fetch tổng tiền Lâm Vũ đã chuyển từ API transactions
 */
async function fetchTotalLamVuTransferred() {
  try {
    console.log("Fetching Lam Vu transferred data...");
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS_COMPANY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const transactions = await response.json();

    // Tính tổng số tiền từ các transaction (mặc định tất cả đều là chuyển tiền từ Lâm Vũ sang Toàn Thành)
    const totalTransferred = transactions.reduce((sum, transaction) => {
      return sum + transaction.amount;
    }, 0);

    console.log(`Lâm Vũ đã chuyển: ${formatCurrency(totalTransferred)} VNĐ`);
    return totalTransferred;
  } catch (error) {
    console.error("Error fetching Lam Vu transferred data:", error);
    return 0;
  }
}

/**
 * Tính toán và cập nhật 3 ô thống kê mới
 */
async function updateExpenseStats() {
  try {
    console.log("Đang cập nhật thống kê chi phí...");

    // Kiểm tra các phần tử DOM có tồn tại không
    if (
      !DOM.totalToanThanhSpentValue ||
      !DOM.totalLamVuTransferredValue ||
      !DOM.totalLamVuRemainingValue
    ) {
      console.warn(
        "Một hoặc nhiều phần tử DOM cho thống kê chi phí không tồn tại"
      );
      return;
    }

    // Hiển thị loading
    DOM.totalToanThanhSpentValue.textContent = "...";
    DOM.totalLamVuTransferredValue.textContent = "...";
    DOM.totalLamVuRemainingValue.textContent = "...";

    if (DOM.totalToanThanhSpentDetail)
      DOM.totalToanThanhSpentDetail.textContent = "Đang tải...";
    if (DOM.totalLamVuTransferredDetail)
      DOM.totalLamVuTransferredDetail.textContent = "Đang tải...";
    if (DOM.totalLamVuRemainingDetail)
      DOM.totalLamVuRemainingDetail.textContent = "Đang tải...";

    // Fetch dữ liệu song song
    const [totalToanThanhSpent, totalLamVuTransferred] = await Promise.all([
      fetchTotalToanThanhSpent(),
      fetchTotalLamVuTransferred(),
    ]);

    // Tính số tiền Lâm Vũ cần chuyển
    const totalLamVuRemaining = Math.max(
      0,
      totalToanThanhSpent - totalLamVuTransferred
    );

    // Cập nhật DOM - KIỂM TRA TỒN TẠI TRƯỚC KHI CẬP NHẬT
    if (DOM.totalToanThanhSpentValue) {
      DOM.totalToanThanhSpentValue.textContent =
        formatCurrencyWithUnit(totalToanThanhSpent);
    }
    if (DOM.totalToanThanhSpentDetail) {
      DOM.totalToanThanhSpentDetail.textContent = `${formatCurrency(
        totalToanThanhSpent
      )} VNĐ`;
    }

    if (DOM.totalLamVuTransferredValue) {
      DOM.totalLamVuTransferredValue.textContent = formatCurrencyWithUnit(
        totalLamVuTransferred
      );
    }
    if (DOM.totalLamVuTransferredDetail) {
      DOM.totalLamVuTransferredDetail.textContent = `${formatCurrency(
        totalLamVuTransferred
      )} VNĐ`;
    }

    if (DOM.totalLamVuRemainingValue) {
      DOM.totalLamVuRemainingValue.textContent =
        formatCurrencyWithUnit(totalLamVuRemaining);
    }
    if (DOM.totalLamVuRemainingDetail) {
      DOM.totalLamVuRemainingDetail.textContent = `${formatCurrency(
        totalLamVuRemaining
      )} VNĐ`;
    }

    // Cập nhật màu sắc cho ô "cần chuyển" - THÊM KIỂM TRA
    if (DOM.totalLamVuRemainingCard) {
      // Xóa class cũ
      DOM.totalLamVuRemainingCard.classList.remove(
        "bg-amber-50",
        "dark:bg-amber-900/20",
        "border-amber-200",
        "dark:border-amber-800/30",
        "bg-emerald-50",
        "dark:bg-emerald-900/20",
        "border-emerald-200",
        "dark:border-emerald-800/30"
      );

      // Thêm class mới dựa trên số tiền
      if (totalLamVuRemaining > 0) {
        DOM.totalLamVuRemainingCard.classList.add(
          "bg-amber-50",
          "dark:bg-amber-900/20",
          "border-amber-200",
          "dark:border-amber-800/30"
        );
      } else {
        DOM.totalLamVuRemainingCard.classList.add(
          "bg-emerald-50",
          "dark:bg-emerald-900/20",
          "border-emerald-200",
          "dark:border-emerald-800/30"
        );
      }

      // Cập nhật icon container - SỬA SELECTOR
      // Sử dụng selector an toàn hơn: tìm div có class chứa p-1.5
      const iconContainer = DOM.totalLamVuRemainingCard.querySelector(
        'div[class*="p-1\\.5"], div[class*="p-1-5"]'
      );

      // Fallback: tìm div con đầu tiên trong phần header
      if (!iconContainer) {
        const headerDiv = DOM.totalLamVuRemainingCard.querySelector(
          ".flex.justify-between"
        );
        if (headerDiv) {
          iconContainer = headerDiv.querySelector("div:last-child");
        }
      }

      if (iconContainer) {
        // Xóa class cũ
        iconContainer.classList.remove(
          "bg-amber-100",
          "dark:bg-amber-800/40",
          "text-amber-600",
          "dark:text-amber-400",
          "bg-emerald-100",
          "dark:bg-emerald-800/40",
          "text-emerald-600",
          "dark:text-emerald-400"
        );

        if (totalLamVuRemaining > 0) {
          iconContainer.classList.add(
            "bg-amber-100",
            "dark:bg-amber-800/40",
            "text-amber-600",
            "dark:text-amber-400"
          );
        } else {
          iconContainer.classList.add(
            "bg-emerald-100",
            "dark:bg-emerald-800/40",
            "text-emerald-600",
            "dark:text-emerald-400"
          );
        }
      }
    }

    console.log("✅ Đã cập nhật thống kê chi phí:");
    console.log(
      "- Toàn Thành đã chi:",
      formatCurrency(totalToanThanhSpent),
      "VNĐ"
    );
    console.log(
      "- Lâm Vũ đã chuyển:",
      formatCurrency(totalLamVuTransferred),
      "VNĐ"
    );
    console.log(
      "- Lâm Vũ cần chuyển:",
      formatCurrency(totalLamVuRemaining),
      "VNĐ"
    );
  } catch (error) {
    console.error("Error updating expense stats:", error);

    // Hiển thị lỗi - KIỂM TRA TỒN TẠI
    if (DOM.totalToanThanhSpentValue)
      DOM.totalToanThanhSpentValue.textContent = "Lỗi";
    if (DOM.totalLamVuTransferredValue)
      DOM.totalLamVuTransferredValue.textContent = "Lỗi";
    if (DOM.totalLamVuRemainingValue)
      DOM.totalLamVuRemainingValue.textContent = "Lỗi";

    if (DOM.totalToanThanhSpentDetail)
      DOM.totalToanThanhSpentDetail.textContent = "Không thể tải dữ liệu";
    if (DOM.totalLamVuTransferredDetail)
      DOM.totalLamVuTransferredDetail.textContent = "Không thể tải dữ liệu";
    if (DOM.totalLamVuRemainingDetail)
      DOM.totalLamVuRemainingDetail.textContent = "Không thể tải dữ liệu";
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
  // 1. Ép kiểu về số an toàn (xử lý cả trường hợp input là string "1600000000")
  const num = Number(amount);

  // Nếu không phải số hoặc bằng 0 thì trả về 0
  if (isNaN(num) || num === 0) return "0";

  let result = "";
  let unit = "";

  if (num >= 1000000000) {
    // Trường hợp Tỷ
    // toFixed(2) giữ 2 số lẻ -> parseFloat để cắt số 0 thừa -> toString để replace dấu
    result = parseFloat((num / 1000000000).toFixed(2))
      .toString()
      .replace(".", ",");
    unit = " Tỷ";
  } else if (num >= 1000000) {
    // Trường hợp Triệu
    result = parseFloat((num / 1000000).toFixed(2))
      .toString()
      .replace(".", ",");
    unit = " Triệu";
  } else {
    // Trường hợp nhỏ hơn 1 Triệu (ví dụ 500.000)
    // Dùng Regex để thêm dấu chấm phân cách hàng nghìn thủ công (không cần toLocaleString)
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return `${result}${unit}`;
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
  DOM.totalContractNumberValueCard.textContent =
    kpis.totalContractValue.toLocaleString() + " VNĐ";
  DOM.totalCollectedCard.textContent = formatCurrencyWithUnit(
    kpis.totalCollected
  );
  DOM.totalRemainingCard.textContent = formatCurrencyWithUnit(
    kpis.totalRemaining
  );

  // Cập nhật phần trăm
  DOM.collectedPercentage.textContent = `${kpis.totalCollected.toLocaleString()} VNĐ`;
  DOM.remainingPercentage.textContent = `${kpis.totalRemaining.toLocaleString()} VNĐ`;
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
    }

    // Luôn cập nhật thống kê chi phí (ngay cả khi không có dự án)
    try {
      await updateExpenseStats();
    } catch (expenseError) {
      console.warn("Không thể tải thống kê chi phí:", expenseError);
      // Vẫn tiếp tục chạy ứng dụng nếu chỉ lỗi phần thống kê chi phí
    }

    if (projects.length > 0) {
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
    } else {
      console.log("Không có dự án nào được tìm thấy");
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

/**
 * Kiểm tra tất cả DOM elements
 */
function validateDOMElements() {
  console.log("🔍 Kiểm tra DOM elements:");

  const elements = [
    { name: "projectsTableBody", element: DOM.projectsTableBody },
    { name: "tableFooter", element: DOM.tableFooter },
    { name: "totalProjectsCard", element: DOM.totalProjectsCard },
    { name: "totalContractValueCard", element: DOM.totalContractValueCard },
    { name: "totalCollectedCard", element: DOM.totalCollectedCard },
    { name: "totalRemainingCard", element: DOM.totalRemainingCard },
    { name: "collectedPercentage", element: DOM.collectedPercentage },
    { name: "remainingPercentage", element: DOM.remainingPercentage },
    { name: "totalToanThanhSpentValue", element: DOM.totalToanThanhSpentValue },
    {
      name: "totalToanThanhSpentDetail",
      element: DOM.totalToanThanhSpentDetail,
    },
    {
      name: "totalLamVuTransferredValue",
      element: DOM.totalLamVuTransferredValue,
    },
    {
      name: "totalLamVuTransferredDetail",
      element: DOM.totalLamVuTransferredDetail,
    },
    { name: "totalLamVuRemainingValue", element: DOM.totalLamVuRemainingValue },
    {
      name: "totalLamVuRemainingDetail",
      element: DOM.totalLamVuRemainingDetail,
    },
    { name: "totalToanThanhSpentCard", element: DOM.totalToanThanhSpentCard },
    {
      name: "totalLamVuTransferredCard",
      element: DOM.totalLamVuTransferredCard,
    },
    { name: "totalLamVuRemainingCard", element: DOM.totalLamVuRemainingCard },
  ];

  elements.forEach(({ name, element }) => {
    if (!element) {
      console.warn(`❌ ${name}: Không tìm thấy`);
    } else {
      console.log(`✅ ${name}: Tồn tại`);
    }
  });
}

// Gọi kiểm tra DOM (tùy chọn, có thể comment lại sau khi debug)
// document.addEventListener("DOMContentLoaded", validateDOMElements);

// ================ Popup Functions ================

async function showToanThanhDetails() {
  try {
    console.log("Đang tải chi tiết Toàn Thành...");

    // Hiển thị loading
    showPopupLoading("Đang tải chi tiết các hạng mục chi phí...");

    // Fetch dữ liệu contracts
    const contracts = await fetchToanThanhContracts();

    if (contracts.length === 0) {
      showPopup({
        title: "Chi tiết Toàn Thành đã chi",
        content: `
          <div class="text-center py-8 text-text-secondary dark:text-gray-400">
            <span class="material-symbols-outlined text-3xl mb-2">receipt</span>
            <p>Không có hợp đồng chi phí nào</p>
          </div>
        `,
      });
      return;
    }

    // Tính tổng
    const totalSpent = contracts.reduce((sum, contract) => {
      const paidInContract = (contract.payments || [])
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);
      return sum + paidInContract;
    }, 0);

    // Đếm số dự án (unique projectId)
    const uniqueProjectIds = [
      ...new Set(contracts.map((c) => c.projectId).filter((id) => id)),
    ];

    const tableContent = renderToanThanhTable(contracts);

    showPopup({
      title:
        `Tổng tiền Toàn Thành đã chi: ` + formatCurrency(totalSpent) + ` VNĐ`,
      content: tableContent,
    });
  } catch (error) {
    console.error("Error showing Toan Thanh details:", error);
    showPopup({
      title: "Lỗi",
      content: `
        <div class="text-center py-8 text-red-600 dark:text-red-400">
          <span class="material-symbols-outlined text-3xl mb-2">error</span>
          <p>Không thể tải chi tiết</p>
          <p class="text-sm mt-2">${error.message}</p>
        </div>
      `,
    });
  }
}

/**
 * Hiển thị popup chi tiết Lâm Vũ đã chuyển
 */
async function showLamVuTransferredDetails() {
  try {
    console.log("Đang tải chi tiết Lâm Vũ đã chuyển...");

    // Hiển thị loading
    showPopupLoading("Đang tải chi tiết các lần chuyển tiền...");

    // Fetch dữ liệu
    const transactions = await fetchLamVuTransactions();

    if (transactions.length === 0) {
      showPopup({
        title: "Chi tiết Lâm Vũ đã chuyển",
        content: `
          <div class="text-center py-8 text-text-secondary dark:text-gray-400">
            <span class="material-symbols-outlined text-3xl mb-2">payments</span>
            <p>Không có giao dịch chuyển tiền nào</p>
          </div>
        `,
      });
      return;
    }

    // Tính tổng
    const totalTransferred = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Đếm số dự án (unique projectId)
    const uniqueProjectIds = [
      ...new Set(transactions.map((t) => t.projectId).filter((id) => id)),
    ];

    const tableContent = renderLamVuTable(transactions);

    showPopup({
      title:
        `Tổng tiền Lâm Vũ đã chuyển: ` +
        formatCurrency(totalTransferred) +
        ` VNĐ - ` +
        transactions.length +
        ` giao dịch`,
      content: tableContent,
    });
  } catch (error) {
    console.error("Error showing Lam Vu details:", error);
    showPopup({
      title: "Lỗi",
      content: `
        <div class="text-center py-8 text-red-600 dark:text-red-400">
          <span class="material-symbols-outlined text-3xl mb-2">error</span>
          <p>Không thể tải chi tiết</p>
          <p class="text-sm mt-2">${error.message}</p>
        </div>
      `,
    });
  }
}

/**
 * Fetch danh sách hợp đồng Toàn Thành cho popup
 */
async function fetchToanThanhContracts() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTRACTS_BUYER}`
    );

    if (!response.ok) throw new Error("Failed to fetch contracts");
    return await response.json();
  } catch (error) {
    console.error("Error fetching Toan Thanh contracts:", error);
    return [];
  }
}

/**
 * Fetch danh sách giao dịch Lâm Vũ cho popup
 */
async function fetchLamVuTransactions() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS_COMPANY}`
    );

    if (!response.ok) throw new Error("Failed to fetch transactions");
    return await response.json();
  } catch (error) {
    console.error("Error fetching Lam Vu transactions:", error);
    return [];
  }
}

/**
 * Render table chi tiết Toàn Thành - NHÓM THEO DỰ ÁN
 */
function renderToanThanhTable(contracts) {
  // Nhóm hợp đồng theo dự án
  const projectsMap = {};

  contracts.forEach((contract) => {
    const projectId = contract.projectId || "unknown";
    const projectName = contract.project?.name || "Dự án không xác định";

    if (!projectsMap[projectId]) {
      projectsMap[projectId] = {
        name: projectName,
        contracts: [],
        totalValue: 0,
        totalPaid: 0,
      };
    }

    const paidInContract = (contract.payments || [])
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    projectsMap[projectId].contracts.push({
      ...contract,
      paid: paidInContract,
    });

    projectsMap[projectId].totalValue += contract.totalValue || 0;
    projectsMap[projectId].totalPaid += paidInContract;
  });

  // Tạo HTML cho từng dự án
  let projectsHtml = "";

  Object.values(projectsMap).forEach((project, index) => {
    const projectPercent =
      project.totalValue > 0
        ? ((project.totalPaid / project.totalValue) * 100).toFixed(1)
        : 0;

    projectsHtml += `
      <div class="mb-8 ${
        index > 0 ? "pt-6 border-t border-gray-200 dark:border-gray-700" : ""
      }">
        <!-- Project Header -->
        <div class="flex justify-between items-center mb-4">
          <div>
            <h4 class="text-lg font-bold text-text-main dark:text-white">${
              project.name
            }</h4>
            <div class="flex items-center gap-4 mt-2">
              <div class="text-sm">
                <span class="text-text-secondary dark:text-gray-400">Tổng HĐ:</span>
                <span class="font-medium text-text-main dark:text-white ml-2">
                  ${formatCurrency(project.totalValue)}
                </span>
              </div>
              <div class="text-sm">
                <span class="text-text-secondary dark:text-gray-400">Đã chi:</span>
                <span class="font-medium text-emerald-600 dark:text-emerald-400 ml-2">
                  ${formatCurrency(project.totalPaid)}
                </span>
              </div>
              <div class="text-sm">
                <span class="text-text-secondary dark:text-gray-400">Tỷ lệ:</span>
                <span class="font-medium text-blue-600 dark:text-blue-400 ml-2">
                  ${projectPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Contracts Table for this Project -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-text-secondary dark:text-gray-400">
                <th class="p-3 text-left">Nhà cung cấp</th>
                <th class="p-3 text-left">Nội dung hợp đồng</th>
                <th class="p-3 text-right">Giá trị HĐ</th>
                <th class="p-3 text-right">Đã thanh toán</th>
                <th class="p-3 text-right">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              ${project.contracts
                .map((contract) => {
                  const progressPercent =
                    contract.totalValue > 0
                      ? ((contract.paid / contract.totalValue) * 100).toFixed(1)
                      : 0;

                  return `
                  <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-3 text-sm text-text-main dark:text-white">
                      <div class="font-medium">${
                        contract.sellerCompany?.name || "N/A"
                      }</div>
                      ${
                        contract.contractDate
                          ? `
                        <div class="text-xs text-text-secondary dark:text-gray-400 mt-1">
                          ${
                            formatPopupDate(contract.contractDate).split(",")[0]
                          }
                        </div>
                      `
                          : ""
                      }
                    </td>
                    <td class="p-3 text-sm text-text-secondary dark:text-gray-300">
                      ${contract.description || "Không có mô tả"}
                      ${
                        contract.contractNumber
                          ? `
                        <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Số HĐ: ${contract.contractNumber}
                        </div>
                      `
                          : ""
                      }
                    </td>
                    <td class="p-3 text-sm text-right font-medium text-text-main dark:text-white">
                      ${formatCurrency(contract.totalValue || 0)}
                    </td>
                    <td class="p-3 text-right">
                      <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${formatCurrency(contract.paid)}
                      </div>
                    </td>
                    <td class="p-3 text-right">
                      <div class="text-sm font-medium ${
                        progressPercent >= 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      }">
                        ${progressPercent}%
                      </div>
                      <div class="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ml-auto mt-1">
                        <div class="h-full ${
                          progressPercent >= 100
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }" 
                             style="width: ${Math.min(
                               progressPercent,
                               100
                             )}%"></div>
                      </div>
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  return `
    <div class="popup-table-container">
      ${projectsHtml}
    </div>
  `;
}

/**
 * Render table chi tiết Lâm Vũ - ĐƠN GIẢN HÓA
 */
function renderLamVuTable(transactions) {
  // Nhóm giao dịch theo ngày (có thể theo dự án nếu có thông tin)
  const rows = transactions
    .map((transaction, index) => {
      // Format ngày đơn giản (chỉ ngày tháng năm)
      const formattedDate = formatSimpleDate(
        transaction.paymentDate || transaction.createdAt
      );

      return `
      <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
        <td class="p-4 text-sm text-center text-text-main dark:text-white font-medium">
          ${index + 1}
        </td>
        <td class="p-4 text-sm text-text-secondary dark:text-gray-300">
          <div class="text-text-main dark:text-white mb-1">
            ${transaction.description || "Không có mô tả"}
          </div>
        </td>
        <td class="p-4 text-sm text-right font-medium text-text-main dark:text-white">
          ${formatCurrency(transaction.amount)}
        </td>
        <td class="p-4 text-sm text-text-secondary dark:text-gray-400 text-center">
          ${formattedDate}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="popup-table-container">
      <table class="popup-table w-full border-collapse">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-800">
            <th class="p-4 text-sm font-medium text-text-secondary dark:text-gray-400 text-center rounded-tl-lg">STT</th>
            <th class="p-4 text-sm font-medium text-text-secondary dark:text-gray-400 text-left">Nội dung chuyển tiền</th>
            <th class="p-4 text-sm font-medium text-text-secondary dark:text-gray-400 text-right">Số tiền</th>
            <th class="p-4 text-sm font-medium text-text-secondary dark:text-gray-400 text-center rounded-tr-lg">Ngày chuyển</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Format date cho popup
 */
function formatPopupDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString.split("T")[0] || "N/A";
  }
}

/**
 * Format date đơn giản chỉ hiển thị ngày
 */
function formatSimpleDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString.split("T")[0] || "N/A";
  }
}

/**
 * Hiển thị popup loading
 */
function showPopupLoading(message = "Đang tải...") {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.id = "popupOverlay";

  overlay.innerHTML = `
    <div class="popup-content">
      <div class="p-6">
        <div class="flex flex-col items-center justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-text-main dark:text-white">${message}</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });
}

/**
 * Hiển thị popup với nội dung
 */
function showPopup({ title, content }) {
  // Đóng popup cũ nếu có
  closePopup();

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.id = "popupOverlay";

  overlay.innerHTML = `
    <div class="popup-content">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-bold text-text-main dark:text-white">${title}</h3>
        <button 
          onclick="closePopup()" 
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span class="material-symbols-outlined text-text-main dark:text-white">close</span>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        ${content}
      </div>
      
      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button 
          onclick="closePopup()" 
          class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });
}

/**
 * Đóng popup
 */
function closePopup() {
  const overlay = document.getElementById("popupOverlay");
  if (overlay) {
    overlay.remove();
  }
}

// Thêm event listener cho phím ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePopup();
  }
});
