// app.js - Logic ứng dụng

// ================ DOM Elements ================
const DOM = {
  projectsTableBody: document.getElementById("projectsTableBody"),
  tableFooter: document.getElementById("tableFooter"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  addProjectBtn: document.getElementById("addProjectBtn"),
  refreshDataBtn: document.getElementById("refreshDataBtn"),

  // KPI Cards
  totalProjectsCard: document.querySelector("#totalProjectsCard .text-3xl"),
  activeProjectsCard: document.querySelector("#activeProjectsCard .text-3xl"),
  completedProjectsCard: document.querySelector(
    "#completedProjectsCard .text-3xl"
  ),
  totalContractValueCard: document.querySelector(
    "#totalContractValueCard .text-3xl"
  ),
};

// ================ Utility Functions ================

/**
 * Format số tiền VNĐ
 * @param {number} amount - Số tiền cần format
 * @returns {string} Số tiền đã được format
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Tính giá trị còn lại
 * @param {number} contractValue - Giá trị hợp đồng
 * @param {number} collected - Đã thu
 * @returns {number} Giá trị còn lại
 */
function calculateRemaining(contractValue, collected) {
  return contractValue - collected;
}

/**
 * Lấy tên trạng thái
 * @param {string} status - Mã trạng thái
 * @returns {string} Tên trạng thái
 */
function getStatusText(status) {
  const statusMap = {
    active: "Đang tiến hành",
    pending: "Chờ duyệt",
    completed: "Đã hoàn thành",
  };
  return statusMap[status] || "Không xác định";
}

/**
 * Lấy class CSS cho trạng thái
 * @param {string} status - Mã trạng thái
 * @returns {string} Class CSS
 */
function getStatusClass(status) {
  const classMap = {
    active: "status-active",
    pending: "status-pending",
    completed: "status-completed",
  };
  return classMap[status] || "status-pending";
}

/**
 * Format ngày tháng
 * @param {string} dateString - Chuỗi ngày tháng
 * @returns {string} Ngày tháng đã format
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

// ================ Business Logic ================

/**
 * Lọc dự án dựa trên tìm kiếm và bộ lọc
 */
function filterProjects() {
  const searchTerm = DOM.searchInput.value.toLowerCase();
  const statusFilter = DOM.statusFilter.value;

  let filtered = projectsData;

  // Cập nhật state
  appState.searchTerm = searchTerm;
  appState.statusFilter = statusFilter;

  // Lọc theo tìm kiếm
  if (searchTerm) {
    filtered = filtered.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.code.toLowerCase().includes(searchTerm) ||
        project.investor.toLowerCase().includes(searchTerm) ||
        project.location.toLowerCase().includes(searchTerm)
    );
  }

  // Lọc theo trạng thái
  if (statusFilter) {
    filtered = filtered.filter((project) => project.status === statusFilter);
  }

  // Cập nhật state
  appState.filteredProjects = filtered;

  // Cập nhật UI
  updateKPIStats(filtered);
  renderProjectsTable(filtered);
}

/**
 * Tính toán và cập nhật KPI
 * @param {Array} projects - Danh sách dự án
 */
function updateKPIStats(projects) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;

  const totalContractValue = projects.reduce(
    (sum, project) => sum + project.contractValue,
    0
  );
  const totalContractValueInBillions = (
    totalContractValue / 1000000000
  ).toFixed(3);

  // Cập nhật DOM
  DOM.totalProjectsCard.textContent = totalProjects;
  DOM.activeProjectsCard.textContent = activeProjects;
  DOM.completedProjectsCard.textContent = completedProjects;
  DOM.totalContractValueCard.textContent = `${totalContractValueInBillions} Tỷ`;
}

/**
 * Render dòng dự án
 * @param {Object} project - Thông tin dự án
 * @returns {string} HTML string
 */
function renderProjectRow(project) {
  const remaining = calculateRemaining(
    project.contractValue,
    project.collected
  );
  const progressPercent = project.progress || 0;

  return `
      <tr class="group hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors table-row-hover">
        <td class="py-4 px-6 text-sm font-medium text-text-main dark:text-white whitespace-nowrap">
          ${project.code}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-primary hover:underline cursor-pointer project-name">
              ${project.name}
            </span>
            <span class="text-xs text-text-secondary">${project.location}</span>
            <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-primary h-1.5 rounded-full" style="width: ${progressPercent}%"></div>
            </div>
            <div class="flex justify-between text-xs text-text-secondary mt-0.5">
              <span>Tiến độ: ${progressPercent}%</span>
              <span>${formatDate(project.startDate)} - ${formatDate(
    project.endDate
  )}</span>
            </div>
          </div>
        </td>
        <td class="py-4 px-6 text-sm text-text-main dark:text-white whitespace-nowrap">
          <div class="flex items-center gap-2">
            <div class="size-6 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover flex items-center justify-center" 
                 style="background-image: ${
                   project.investorLogo
                     ? `url('${project.investorLogo}')`
                     : "none"
                 };">
              ${!project.investorLogo ? project.investor.charAt(0) : ""}
            </div>
            ${project.investor}
          </div>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
            project.status
          )}">
            ${getStatusText(project.status)}
          </span>
        </td>
        <td class="py-4 px-6 text-sm font-bold text-text-main dark:text-white text-right whitespace-nowrap">
          ${formatCurrency(project.contractValue)}
        </td>
        <td class="py-4 px-6 text-sm font-bold text-text-main dark:text-white text-right whitespace-nowrap">
          ${formatCurrency(project.collected)}
        </td>
        <td class="py-4 px-6 text-sm font-bold ${
          remaining > 0
            ? "text-red-600 dark:text-red-400"
            : "text-green-600 dark:text-green-400"
        } text-right whitespace-nowrap">
          ${formatCurrency(remaining)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded btn-hover" title="Xem chi tiết" data-action="view" data-id="${
              project.id
            }">
              <span class="material-symbols-outlined text-lg text-text-secondary">visibility</span>
            </button>
            <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded btn-hover" title="Chỉnh sửa" data-action="edit" data-id="${
              project.id
            }">
              <span class="material-symbols-outlined text-lg text-text-secondary">edit</span>
            </button>
            <button class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded btn-hover" title="Xóa" data-action="delete" data-id="${
              project.id
            }">
              <span class="material-symbols-outlined text-lg text-text-secondary">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
}

/**
 * Render bảng dự án
 * @param {Array} projects - Danh sách dự án
 */
function renderProjectsTable(projects) {
  const tableBody = DOM.projectsTableBody;
  const tableFooter = DOM.tableFooter;

  if (projects.length === 0) {
    tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-12 text-center text-text-secondary dark:text-gray-400">
            <div class="flex flex-col items-center gap-3">
              <span class="material-symbols-outlined text-5xl">search_off</span>
              <p class="font-medium text-lg">Không tìm thấy dự án nào</p>
              <p class="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              <button id="clearFiltersBtn" class="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                Xóa bộ lọc
              </button>
            </div>
          </td>
        </tr>
      `;

    // Thêm event listener cho nút xóa bộ lọc
    setTimeout(() => {
      const clearFiltersBtn = document.getElementById("clearFiltersBtn");
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", clearFilters);
      }
    }, 0);
  } else {
    tableBody.innerHTML = projects
      .map((project) => renderProjectRow(project))
      .join("");
  }

  // Cập nhật footer
  const startIndex = (appState.currentPage - 1) * appConfig.itemsPerPage + 1;
  const endIndex = Math.min(
    startIndex + appConfig.itemsPerPage - 1,
    projects.length
  );
  tableFooter.textContent = `Hiển thị ${startIndex}-${endIndex} của ${projects.length} dự án`;
}

/**
 * Thêm dự án mới
 */
function addNewProject() {
  // Tạo ID mới
  const newId =
    projectsData.length > 0
      ? Math.max(...projectsData.map((p) => p.id)) + 1
      : 1;
  const currentYear = new Date().getFullYear();

  // Tạo dự án mới
  const newProject = {
    id: newId,
    code: `LV-${currentYear}-${String(newId).padStart(3, "0")}`,
    name: `Dự án mới ${newId}`,
    location: "Hà Nội",
    investor: "Chủ đầu tư mới",
    investorLogo: "",
    status: "pending",
    contractValue: Math.floor(10000000000 + Math.random() * 90000000000),
    collected: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setFullYear(currentYear + 1))
      .toISOString()
      .split("T")[0],
    progress: 0,
  };

  // Thêm vào đầu mảng
  projectsData.unshift(newProject);

  // Cập nhật UI
  filterProjects();

  // Thông báo
  showNotification(
    `Đã thêm dự án mới: ${newProject.code} - ${newProject.name}`,
    "success"
  );
}

/**
 * Xử lý hành động trên dự án
 * @param {string} action - Hành động (view, edit, delete)
 * @param {number} projectId - ID dự án
 */
function handleProjectAction(action, projectId) {
  const project = projectsData.find((p) => p.id === projectId);
  if (!project) return;

  switch (action) {
    case "view":
      showProjectDetails(project);
      break;
    case "edit":
      editProject(project);
      break;
    case "delete":
      deleteProject(project);
      break;
  }
}

/**
 * Hiển thị chi tiết dự án
 * @param {Object} project - Thông tin dự án
 */
function showProjectDetails(project) {
  const remaining = calculateRemaining(
    project.contractValue,
    project.collected
  );
  const progress = project.progress || 0;

  const message = `
      Dự án: ${project.code} - ${project.name}
      
      Địa điểm: ${project.location}
      Chủ đầu tư: ${project.investor}
      Trạng thái: ${getStatusText(project.status)}
      
      Giá trị hợp đồng: ${formatCurrency(project.contractValue)} VNĐ
      Đã thu: ${formatCurrency(project.collected)} VNĐ
      Còn lại: ${formatCurrency(remaining)} VNĐ
      Tiến độ: ${progress}%
      
      Thời gian: ${formatDate(project.startDate)} - ${formatDate(
    project.endDate
  )}
    `;

  alert(message);
}

/**
 * Chỉnh sửa dự án
 * @param {Object} project - Thông tin dự án
 */
function editProject(project) {
  const newName = prompt(`Chỉnh sửa tên dự án ${project.code}:`, project.name);
  if (newName && newName.trim() !== "") {
    project.name = newName.trim();
    filterProjects();
    showNotification(`Đã cập nhật tên dự án thành: ${newName}`, "info");
  }
}

/**
 * Xóa dự án
 * @param {Object} project - Thông tin dự án
 */
function deleteProject(project) {
  if (
    confirm(
      `Bạn có chắc chắn muốn xóa dự án ${project.code} - ${project.name}?`
    )
  ) {
    const index = projectsData.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projectsData.splice(index, 1);
      filterProjects();
      showNotification(`Đã xóa dự án: ${project.code}`, "warning");
    }
  }
}

/**
 * Xóa bộ lọc
 */
function clearFilters() {
  DOM.searchInput.value = "";
  DOM.statusFilter.value = "";
  filterProjects();
}

/**
 * Hiển thị thông báo
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  // Tạo element thông báo
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full z-50 ${
    type === "success"
      ? "bg-green-100 text-green-800 border border-green-200"
      : type === "error"
      ? "bg-red-100 text-red-800 border border-red-200"
      : type === "warning"
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : "bg-blue-100 text-blue-800 border border-blue-200"
  }`;

  notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined">
          ${
            type === "success"
              ? "check_circle"
              : type === "error"
              ? "error"
              : type === "warning"
              ? "warning"
              : "info"
          }
        </span>
        <span class="font-medium">${message}</span>
      </div>
    `;

  document.body.appendChild(notification);

  // Hiệu ứng hiện
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 10);

  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// ================ Event Handlers ================

/**
 * Xử lý click trên bảng
 */
function handleTableClick(e) {
  // Click vào tên dự án
  if (e.target.classList.contains("project-name")) {
    const row = e.target.closest("tr");
    const projectCode = row.querySelector("td:first-child").textContent;
    const project = projectsData.find((p) => p.code === projectCode);
    if (project) {
      showProjectDetails(project);
    }
    return;
  }

  // Click vào nút hành động
  const actionBtn = e.target.closest("button[data-action]");
  if (actionBtn) {
    const action = actionBtn.getAttribute("data-action");
    const projectId = parseInt(actionBtn.getAttribute("data-id"));
    handleProjectAction(action, projectId);
  }
}

// ================ Initialization ================

/**
 * Khởi tạo ứng dụng
 */
function initApp() {
  // Render dữ liệu ban đầu
  updateKPIStats(projectsData);
  renderProjectsTable(projectsData);

  // Thêm event listeners
  DOM.searchInput.addEventListener("input", filterProjects);
  DOM.statusFilter.addEventListener("change", filterProjects);
  DOM.addProjectBtn.addEventListener("click", addNewProject);
  DOM.refreshDataBtn.addEventListener("click", () => {
    filterProjects();
    showNotification("Dữ liệu đã được làm mới!", "info");
  });

  // Thêm event listener cho bảng
  DOM.projectsTableBody.addEventListener("click", handleTableClick);

  // Khởi tạo state
  appState.filteredProjects = [...projectsData];

  console.log("Ứng dụng Quản lý Dự án đã được khởi chạy!");
  console.log(`Tổng số dự án: ${projectsData.length}`);
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
