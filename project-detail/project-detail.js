// project-detail.js - Logic trang chi tiết dự án (API version)

// ================ DOM Elements ================
const DOM = {
  projectDetailContent: document.getElementById("projectDetailContent"),
};

// ================ Configuration ================
const API_CONFIG = {
  // BASE_URL: "http://localhost:3000",
  BASE_URL: "https://finance-cluster-be.onrender.com",
  ENDPOINTS: {
    PROJECTS: "/api/projects",
  },
};

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
 * Tính giá trị chưa thu
 */
function calculateRemaining(contractValue, collected) {
  return Math.max(0, contractValue - collected);
}

/**
 * Tính tỷ lệ phần trăm
 */
function calculatePercentage(paidAmount, totalAmount) {
  try {
    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount);

    if (isNaN(total) || isNaN(paid) || total <= 0) {
      return 0;
    }

    const percentage = (paid / total) * 100;
    return parseFloat(Math.min(Math.max(percentage, 0), 100).toFixed(1));
  } catch (error) {
    console.error("Error calculating percentage:", error);
    return 0;
  }
}

/**
 * Format ngày tháng từ ISO string
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateString.split("T")[0]; // Trả về phần date nếu có lỗi
  }
}

/**
 * Tính tổng đã thu từ payments array
 */
function calculateCollectedFromPayments(payments) {
  if (!payments || !Array.isArray(payments)) return 0;
  return payments
    .filter((p) => p.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Fetch dự án theo ID từ API
 */
async function fetchProjectById(projectId) {
  try {
    console.log(`Đang fetch dự án với ID: ${projectId}`);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROJECTS}/${projectId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const project = await response.json();
    // console.log("API trả về:", projects.length, "dự án");

    // Tìm dự án theo ID
    // const project = projects.find((p) => p._id === projectId);

    if (!project) {
      console.error("Không tìm thấy dự án với ID:", projectId);
      console.log(
        "Các ID có sẵn:",
        projects.map((p) => p._id)
      );
      throw new Error(`Không tìm thấy dự án với ID: ${projectId}`);
    }

    console.log("Tìm thấy dự án:", project.name);
    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

/**
 * Tạo timeline các đợt thu từ payments
 */
function createPaymentTimeline(contractValue, payments) {
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return `
          <div class="text-center py-8 text-text-secondary dark:text-gray-400">
              <span class="material-symbols-outlined text-3xl mb-2">payments</span>
              <p>Chưa có thông tin thanh toán</p>
          </div>
      `;
  }

  return payments
    .map((payment) => {
      const isPaid = payment.status === "paid";
      const dueDate = formatDate(payment.dueDate);
      const paidDate = payment.paidDate ? formatDate(payment.paidDate) : null;

      return `
          <div class="flex items-start gap-4 p-4 border-b border-border-color dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div class="flex-shrink-0">
                  
              </div>
              <div class="flex-1">
                  <div class="flex justify-between items-start">
                      <div>
                          <h4 class="font-medium text-text-main dark:text-white">${
                            payment.name
                          }</h4>
                          <div class="flex flex-col gap-1 mt-1">
                              ${
                                payment.condition
                                  ? `
                                  <p class="text-sm text-text-secondary dark:text-gray-400">
                                      Điều kiện: ${payment.condition}
                                  </p>
                              `
                                  : ""
                              }
                          </div>
                      </div>
                      <div class="text-right">
                          <p class="font-bold ${
                            isPaid
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }">
                              ${formatCurrency(payment.amount)}
                          </p>
                          <p class="text-sm text-text-secondary dark:text-gray-400">
                              ${calculatePercentage(
                                payment.amount,
                                contractValue
                              ).toFixed(1)}%
                          </p>
                      </div>
                  </div>
                  <div class="mt-2 flex justify-between items-center">
                      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }">
                          <span class="material-symbols-outlined text-xs mr-1">
                              ${isPaid ? "done" : "schedule"}
                          </span>
                          ${
                            isPaid
                              ? `Đã thanh toán (${paidDate})`
                              : "Chờ thanh toán"
                          }
                      </span>
                  </div>
              </div>
          </div>
      `;
    })
    .join("");
}

// ================ Business Logic ================

/**
 * Render chi tiết dự án từ API data
 */
function renderProjectDetail(apiProject) {
  if (!apiProject) {
    return renderErrorState("Không tìm thấy dữ liệu dự án");
  }

  // Tính toán từ API data
  const collected = calculateCollectedFromPayments(apiProject.payments);
  const remaining = calculateRemaining(apiProject.contractValue, collected);
  const collectedPercent = calculatePercentage(
    collected,
    apiProject.contractValue
  );
  const remainingPercent = calculatePercentage(
    remaining,
    apiProject.contractValue
  );

  // Dữ liệu mẫu cho phần chi tiết chi phí
  const totalToanThanhSpent = apiProject.estimatedCost * 0.7; // 70% estimatedCost
  const totalLamVuSpent = apiProject.estimatedCost * 0.3; // 30% estimatedCost
  const toanThanhSpentPercent = calculatePercentage(
    totalToanThanhSpent,
    apiProject.contractValue
  );
  const lamVuSpentPercent = calculatePercentage(
    totalLamVuSpent,
    apiProject.contractValue
  );

  return `
      <div class="animate-fadeIn">
          <!-- Header chi tiết -->
          <div class="mb-8">
              <div class="flex items-center gap-4 mb-4">
                  <a href="../index.html" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <span class="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
                  </a>
                  <div class="flex-1">
                      <h2 class="text-3xl font-bold text-text-main dark:text-white mb-2">${
                        apiProject.name
                      }</h2>
                      <div class="flex flex-wrap items-center gap-4 text-text-secondary dark:text-gray-400">
                          <span class="flex items-center gap-1">
                              <span class="material-symbols-outlined align-middle text-base">location_on</span>
                              ${apiProject.location}
                          </span>
                          <span class="flex items-center gap-1">
                              <span class="material-symbols-outlined align-middle text-base">apartment</span>
                              ${apiProject.investor}
                          </span>
                          <span class="flex items-center gap-1">
                              <span class="material-symbols-outlined align-middle text-base">bolt</span>
                              ${
                                apiProject.capacity
                                  ? apiProject.capacity.toFixed(1) + " MWp"
                                  : "N/A"
                              }
                          </span>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Thông tin chính - 2 cột -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Thông tin tài chính - BÊN TRÁI -->
<div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm h-full">
    <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined">monetization_on</span>
        Thông tin tài chính
    </h3>
    
    <div class="space-y-6">
        <!-- Giá trị hợp đồng - HÀNG DUY NHẤT -->
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl shadow-sm">
                        <span class="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <div>
                        <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Giá trị hợp đồng</p>
                        <p class="text-3xl font-bold text-text-main dark:text-white">${formatCurrencyWithUnit(
                          apiProject.contractValue
                        )}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Tổng số tiền</p>
                    <p class="text-xl font-semibold text-primary dark:text-primary-light">${formatCurrency(
                      apiProject.contractValue
                    )}</p>
                </div>
            </div>
        </div>
        
        <!-- Tổng đã thu và Tổng chưa thu - HÀNG THỨ 2 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Tổng đã thu -->
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <span class="material-symbols-outlined">savings</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Tổng đã thu</p>
                            <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">${formatCurrencyWithUnit(
                              collected
                            )}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                            ${collectedPercent}%
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <p class="text-sm text-emerald-600 dark:text-emerald-400">
                        <span class="font-medium">Số tiền:</span> ${formatCurrency(
                          collected
                        )}
                    </p>
                </div>
            </div>
            
            <!-- Tổng chưa thu -->
            <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400 rounded-lg">
                            <span class="material-symbols-outlined">pending</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Tổng chưa thu</p>
                            <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">${formatCurrencyWithUnit(
                              remaining
                            )}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-400 text-sm font-medium">
                            ${remainingPercent}%
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <p class="text-sm text-amber-600 dark:text-amber-400">
                        <span class="font-medium">Số tiền:</span> ${formatCurrency(
                          remaining
                        )}
                    </p>
                </div>
            </div>
        </div>

        <!-- Thanh tiến độ thu tiền -->
        <div class="bg-white dark:bg-[#1a2632] p-5 rounded-lg border border-border-color dark:border-gray-700 shadow-sm">
            <div class="flex justify-between mb-3">
                <div>
                    <h4 class="font-medium text-text-main dark:text-white mb-1">Tiến độ thu tiền</h4>
                    <p class="text-sm text-text-secondary dark:text-gray-400">${collectedPercent}% hợp đồng đã được thanh toán</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${collectedPercent}%</p>
                    <p class="text-sm text-text-secondary dark:text-gray-400">Đã thu</p>
                </div>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full" style="width: ${collectedPercent}%"></div>
            </div>
            <div class="flex justify-between text-xs text-text-secondary dark:text-gray-400">
                <span>0 VNĐ</span>
                <span>${formatCurrency(apiProject.contractValue)} VNĐ</span>
            </div>
        </div>
        
    </div>
</div>

              <!-- Timeline các đợt thu - BÊN PHẢI -->
              <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm h-full flex flex-col">
                  <div class="flex items-center justify-between mb-6">
                      <h3 class="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                          <span class="material-symbols-outlined">schedule</span>
                          Timeline các đợt thu
                      </h3>
                      <div class="flex items-center gap-2">
                          <span class="flex items-center gap-1 text-sm">
                              <div class="size-3 rounded-full bg-emerald-500"></div>
                              <span class="text-text-secondary dark:text-gray-400">Đã thanh toán</span>
                          </span>
                          <span class="flex items-center gap-1 text-sm">
                              <div class="size-3 rounded-full bg-amber-500"></div>
                              <span class="text-text-secondary dark:text-gray-400">Chờ thanh toán</span>
                          </span>
                      </div>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto max-h-[600px]">
                      <div class="space-y-1">
                          ${createPaymentTimeline(
                            apiProject.contractValue,
                            apiProject.payments
                          )}
                      </div>
                  </div>
              </div>
          </div>

          <!-- Chi tiết chi phí đã chi -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <!-- Tổng tiền Toàn Thành đã chi -->
              <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm">
                  <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance</span>
                      Tổng tiền Toàn Thành đã chi (Ước tính)
                  </h3>
                  
                  <div class="space-y-4">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Số tiền đã chi</p>
                              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatCurrencyWithUnit(
                                totalToanThanhSpent
                              )}</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mt-1">${formatCurrency(
                                totalToanThanhSpent
                              )} VNĐ</p>
                          </div>
                          <div class="text-right">
                              <p class="text-2xl font-bold text-text-main dark:text-white">${toanThanhSpentPercent}%</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400">so với tổng HĐ</p>
                          </div>
                      </div>
                      
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style="width: ${toanThanhSpentPercent}%"></div>
                      </div>
                      
                      
                  </div>
              </div>

              <!-- Tổng tiền Lâm Vũ đã chi -->
              <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm">
                  <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">savings</span>
                      Tổng tiền Lâm Vũ đã chi (Ước tính)
                  </h3>
                  
                  <div class="space-y-4">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Số tiền đã chi</p>
                              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatCurrencyWithUnit(
                                totalLamVuSpent
                              )}</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mt-1">${formatCurrency(
                                totalLamVuSpent
                              )} VNĐ</p>
                          </div>
                          <div class="text-right">
                              <p class="text-2xl font-bold text-text-main dark:text-white">${lamVuSpentPercent}%</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400">so với tổng HĐ</p>
                          </div>
                      </div>
                      
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style="width: ${lamVuSpentPercent}%"></div>
                      </div>
                    
                  </div>
              </div>
          </div>

          <!-- ĐÃ XÓA: Thanh % tiền Toàn Thành đã thu và chưa thu -->
          <!-- Phần này đã được bỏ theo yêu cầu -->
      </div>
  `;
}

/**
 * Render trạng thái lỗi
 */
function renderErrorState(message) {
  return `
      <div class="text-center py-12 animate-fadeIn">
          <span class="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
          <h3 class="text-xl font-bold text-text-main dark:text-white mb-2">Không thể tải dữ liệu</h3>
          <p class="text-text-secondary dark:text-gray-400 mb-6">${message}</p>
          <a href="../index.html" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <span class="material-symbols-outlined">arrow_back</span>
              Quay lại danh sách
          </a>
      </div>
  `;
}

// ================ Initialization ================

/**
 * Khởi tạo ứng dụng
 */
async function initProjectDetail() {
  try {
    // Lấy projectId từ localStorage
    const projectId = localStorage.getItem("selectedProjectId");

    if (!projectId) {
      DOM.projectDetailContent.innerHTML = renderErrorState(
        "Không có dự án được chọn. Vui lòng quay lại danh sách và chọn một dự án."
      );
      return;
    }

    // Hiển thị loading
    DOM.projectDetailContent.innerHTML = `
          <div class="flex flex-col items-center justify-center h-64">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-6"></div>
              <p class="text-text-main dark:text-white text-lg font-medium mb-2">Đang tải thông tin dự án...</p>
              <p class="text-text-secondary dark:text-gray-400">Vui lòng chờ trong giây lát</p>
          </div>
      `;

    // Fetch dự án từ API
    const project = await fetchProjectById(projectId);

    // Render chi tiết dự án
    DOM.projectDetailContent.innerHTML = renderProjectDetail(project);

    // Cập nhật title
    if (project) {
      document.title = `${project.name} - Chi tiết Dự án`;
      console.log("✅ Trang chi tiết đã tải thành công");
      console.log("📊 Thông tin dự án:", {
        name: project.name,
        contractValue: formatCurrency(project.contractValue),
        collected: formatCurrency(
          calculateCollectedFromPayments(project.payments)
        ),
        remaining: formatCurrency(
          calculateRemaining(
            project.contractValue,
            calculateCollectedFromPayments(project.payments)
          )
        ),
        payments: project.payments.length,
      });
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo ứng dụng:", error);
  }
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectDetail);
} else {
  initProjectDetail();
}
