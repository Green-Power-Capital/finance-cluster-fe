// app.js - Logic ứng dụng

// ================ DOM Elements ================
const DOM = {
  projectsTableBody: document.getElementById("projectsTableBody"),
  tableFooter: document.getElementById("tableFooter"),

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
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Tính giá trị còn lại
 */
function calculateRemaining(contractValue, collected) {
  return contractValue - collected;
}

/**
 * Lấy tên trạng thái
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
 */
function getStatusClass(status) {
  const classMap = {
    active: "status-active",
    pending: "status-pending",
    completed: "status-completed",
  };
  return classMap[status] || "status-pending";
}

// ================ Business Logic ================

/**
 * Tính toán và cập nhật KPI
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
 */
function renderProjectRow(project) {
  const remaining = calculateRemaining(
    project.contractValue,
    project.collected
  );

  return `
      <tr class="group hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors table-row-hover">
        <td class="py-4 px-6 text-sm font-medium text-text-main dark:text-white whitespace-nowrap">
          ${project.code}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-text-main dark:text-white">
              ${project.name}
            </span>
            <span class="text-xs text-text-secondary">${project.location}</span>
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
      </tr>
    `;
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
              <p class="font-medium text-lg">Không có dữ liệu</p>
            </div>
          </td>
        </tr>
      `;
  } else {
    tableBody.innerHTML = projects
      .map((project) => renderProjectRow(project))
      .join("");
  }

  // Cập nhật footer
  tableFooter.textContent = `Tổng cộng: ${projects.length} dự án`;
}

// ================ Initialization ================

/**
 * Khởi tạo ứng dụng
 */
function initApp() {
  // Render dữ liệu ban đầu
  updateKPIStats(projectsData);
  renderProjectsTable(projectsData);

  // Khởi tạo state
  appState.filteredProjects = [...projectsData];

  console.log("Ứng dụng Quản lý Dự án đã được khởi chạy!");
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
