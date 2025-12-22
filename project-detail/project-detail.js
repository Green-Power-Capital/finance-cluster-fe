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
  if (amount >= 1000000000) {
    const billions = (amount / 1000000000).toFixed(3);
    return `${billions} Tỷ`;
  } else if (amount >= 1000000) {
    const millions = (amount / 1000000).toFixed(2);
    return `${millions} Triệu`;
  } else {
    return formatCurrency(amount);
  }
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
function calculatePercentage(totalAmount, paidAmount) {
  try {
    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount);

    if (isNaN(total) || isNaN(paid) || total <= 0) {
      return 0;
    }

    const percentage = (paid / total) * 100;
    return Math.min(Math.max(percentage, 0), 100);
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
function createPaymentTimeline(payments) {
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
                  <div class="size-10 rounded-full flex items-center justify-center ${
                    isPaid
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }">
                      <span class="material-symbols-outlined">
                          ${isPaid ? "check_circle" : "pending"}
                      </span>
                  </div>
              </div>
              <div class="flex-1">
                  <div class="flex justify-between items-start">
                      <div>
                          <h4 class="font-medium text-text-main dark:text-white">${
                            payment.name
                          }</h4>
                          <div class="flex flex-col gap-1 mt-1">
                              <p class="text-sm text-text-secondary dark:text-gray-400">
                                  Hạn: <strong>${dueDate}</strong>
                              </p>
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
                              ${formatCurrency(payment.amount)} VNĐ
                          </p>
                          <p class="text-sm text-text-secondary dark:text-gray-400">
                              ${calculatePercentage(
                                payment.amount,
                                110592000000
                              ).toFixed(1)}% hợp đồng
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
                      <span class="text-xs text-text-secondary dark:text-gray-400">
                          ID: ${payment.paymentId}
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
                          <span class="flex items-center gap-1">
                              <span class="material-symbols-outlined align-middle text-base">tag</span>
                              ${apiProject.projectCode}
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
                      <!-- Tổng quan tài chính -->
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div class="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg">
                              <div class="flex items-center gap-3 mb-3">
                                  <div class="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                                      <span class="material-symbols-outlined">payments</span>
                                  </div>
                                  <div>
                                      <p class="text-sm text-text-secondary dark:text-gray-400">Giá trị hợp đồng</p>
                                      <p class="text-2xl font-bold text-text-main dark:text-white">${formatCurrencyWithUnit(
                                        apiProject.contractValue
                                      )}</p>
                                  </div>
                              </div>
                              <p class="text-sm text-text-secondary dark:text-gray-400">${formatCurrency(
                                apiProject.contractValue
                              )} VNĐ</p>
                          </div>
                          
                          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-lg">
                              <div class="flex items-center gap-3 mb-3">
                                  <div class="p-2 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                      <span class="material-symbols-outlined">savings</span>
                                  </div>
                                  <div>
                                      <p class="text-sm text-emerald-700 dark:text-emerald-300">Tổng đã thu</p>
                                      <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">${formatCurrencyWithUnit(
                                        collected
                                      )}</p>
                                  </div>
                              </div>
                              <p class="text-sm text-emerald-600 dark:text-emerald-400">
                                  ${formatCurrency(
                                    collected
                                  )} VNĐ • ${collectedPercent}%
                              </p>
                          </div>
                          
                          <div class="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-lg">
                              <div class="flex items-center gap-3 mb-3">
                                  <div class="p-2 bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400 rounded-lg">
                                      <span class="material-symbols-outlined">pending</span>
                                  </div>
                                  <div>
                                      <p class="text-sm text-amber-700 dark:text-amber-300">Tổng chưa thu</p>
                                      <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">${formatCurrencyWithUnit(
                                        remaining
                                      )}</p>
                                  </div>
                              </div>
                              <p class="text-sm text-amber-600 dark:text-amber-400">
                                  ${formatCurrency(
                                    remaining
                                  )} VNĐ • ${remainingPercent}%
                              </p>
                          </div>
                      </div>

                      <!-- Thanh tiến độ thu tiền -->
                      <div class="bg-white dark:bg-[#1a2632] p-5 rounded-lg border border-border-color dark:border-gray-700">
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
                              <span>${formatCurrency(
                                apiProject.contractValue
                              )} VNĐ</span>
                          </div>
                      </div>

                      <!-- Thông tin chi phí ước tính -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div class="flex items-center justify-between mb-2">
                                  <span class="font-medium text-blue-700 dark:text-blue-300">Chi phí ước tính</span>
                                  <span class="text-2xl font-bold text-blue-700 dark:text-blue-300">${formatCurrencyWithUnit(
                                    apiProject.estimatedCost
                                  )}</span>
                              </div>
                              <p class="text-sm text-blue-600 dark:text-blue-400">
                                  ${formatCurrency(
                                    apiProject.estimatedCost
                                  )} VNĐ
                              </p>
                          </div>
                          
                          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div class="flex items-center justify-between mb-2">
                                  <span class="font-medium text-purple-700 dark:text-purple-300">Lợi nhuận dự kiến</span>
                                  <span class="text-2xl font-bold text-purple-700 dark:text-purple-300">${formatCurrencyWithUnit(
                                    apiProject.contractValue -
                                      apiProject.estimatedCost
                                  )}</span>
                              </div>
                              <p class="text-sm text-purple-600 dark:text-purple-400">
                                  ${calculatePercentage(
                                    apiProject.contractValue -
                                      apiProject.estimatedCost,
                                    apiProject.contractValue
                                  )}% hợp đồng
                              </p>
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
                  
                  <div class="flex-1 overflow-y-auto max-h-[400px]">
                      <div class="space-y-1">
                          ${createPaymentTimeline(apiProject.payments)}
                      </div>
                  </div>
                  
                  <!-- Tổng kết payments -->
                  <div class="mt-6 pt-6 border-t border-border-color dark:border-gray-700">
                      <div class="grid grid-cols-2 gap-4">
                          <div class="text-center">
                              <p class="text-sm text-text-secondary dark:text-gray-400">Số đợt thanh toán</p>
                              <p class="text-2xl font-bold text-text-main dark:text-white">${
                                apiProject.payments.length
                              }</p>
                          </div>
                          <div class="text-center">
                              <p class="text-sm text-text-secondary dark:text-gray-400">Đã thanh toán</p>
                              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                  ${
                                    apiProject.payments.filter(
                                      (p) => p.status === "paid"
                                    ).length
                                  }
                              </p>
                          </div>
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
                      
                      <div class="grid grid-cols-2 gap-4 mt-4">
                          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Chi phí vật tư</p>
                              <p class="font-bold text-blue-600 dark:text-blue-400">${formatCurrency(
                                totalToanThanhSpent * 0.6
                              )} VNĐ</p>
                          </div>
                          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Chi phí nhân công</p>
                              <p class="font-bold text-blue-600 dark:text-blue-400">${formatCurrency(
                                totalToanThanhSpent * 0.4
                              )} VNĐ</p>
                          </div>
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
                      
                      <div class="grid grid-cols-2 gap-4 mt-4">
                          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Chi phí quản lý</p>
                              <p class="font-bold text-purple-600 dark:text-purple-400">${formatCurrency(
                                totalLamVuSpent * 0.5
                              )} VNĐ</p>
                          </div>
                          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Chi phí khác</p>
                              <p class="font-bold text-purple-600 dark:text-purple-400">${formatCurrency(
                                totalLamVuSpent * 0.5
                              )} VNĐ</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Thanh % tiền Toàn Thành đã thu và chưa thu -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <!-- Thanh % Tổng tiền Toàn Thành đã thu -->
              <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm">
                  <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">trending_up</span>
                      Tổng tiền Toàn Thành đã thu
                  </h3>
                  
                  <div class="space-y-4">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Số tiền đã thu</p>
                              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${formatCurrencyWithUnit(
                                collected
                              )}</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mt-1">${formatCurrency(
                                collected
                              )} VNĐ</p>
                          </div>
                          <div class="text-right">
                              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${collectedPercent}%</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400">so với tổng HĐ</p>
                          </div>
                      </div>
                      
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full" style="width: ${collectedPercent}%"></div>
                      </div>
                      
                      <div class="flex justify-between text-sm">
                          <span class="text-emerald-600 dark:text-emerald-400">0%</span>
                          <span class="text-emerald-600 dark:text-emerald-400">25%</span>
                          <span class="text-emerald-600 dark:text-emerald-400">50%</span>
                          <span class="text-emerald-600 dark:text-emerald-400">75%</span>
                          <span class="text-emerald-600 dark:text-emerald-400">100%</span>
                      </div>
                  </div>
              </div>

              <!-- Thanh % Tổng tiền Toàn Thành chưa thu -->
              <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm">
                  <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                      <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">trending_down</span>
                      Tổng tiền Toàn Thành chưa thu
                  </h3>
                  
                  <div class="space-y-4">
                      <div class="flex items-center justify-between">
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mb-1">Số tiền chưa thu</p>
                              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">${formatCurrencyWithUnit(
                                remaining
                              )}</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400 mt-1">${formatCurrency(
                                remaining
                              )} VNĐ</p>
                          </div>
                          <div class="text-right">
                              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">${remainingPercent}%</p>
                              <p class="text-sm text-text-secondary dark:text-gray-400">so với tổng HĐ</p>
                          </div>
                      </div>
                      
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div class="bg-gradient-to-r from-amber-500 to-amber-600 h-4 rounded-full" style="width: ${remainingPercent}%"></div>
                      </div>
                      
                      <div class="flex justify-between text-sm">
                          <span class="text-amber-600 dark:text-amber-400">0%</span>
                          <span class="text-amber-600 dark:text-amber-400">25%</span>
                          <span class="text-amber-600 dark:text-amber-400">50%</span>
                          <span class="text-amber-600 dark:text-amber-400">75%</span>
                          <span class="text-amber-600 dark:text-amber-400">100%</span>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Tóm tắt thông tin dự án -->
          <div class="bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm">
              <h3 class="text-lg font-bold text-text-main dark:text-white mb-6">Thông tin tổng hợp</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex items-center gap-3">
                          <div class="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                              <span class="material-symbols-outlined">calendar_today</span>
                          </div>
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400">Ngày bắt đầu</p>
                              <p class="font-bold text-text-main dark:text-white">${formatDate(
                                apiProject.startDate
                              )}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex items-center gap-3">
                          <div class="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                              <span class="material-symbols-outlined">event_available</span>
                          </div>
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400">Ngày kết thúc</p>
                              <p class="font-bold text-text-main dark:text-white">${formatDate(
                                apiProject.endDate
                              )}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex items-center gap-3">
                          <div class="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                              <span class="material-symbols-outlined">auto_graph</span>
                          </div>
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400">Tiến độ dự án</p>
                              <p class="font-bold text-text-main dark:text-white">${
                                apiProject.progress || 0
                              }%</p>
                          </div>
                      </div>
                  </div>
                  
                  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex items-center gap-3">
                          <div class="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                              <span class="material-symbols-outlined">work</span>
                          </div>
                          <div>
                              <p class="text-sm text-text-secondary dark:text-gray-400">Trạng thái</p>
                              <p class="font-bold ${
                                apiProject.status === "in_progress"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : apiProject.status === "completed"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }">
                                  ${
                                    apiProject.status === "in_progress"
                                      ? "Đang thực hiện"
                                      : apiProject.status === "completed"
                                      ? "Đã hoàn thành"
                                      : apiProject.status === "planning"
                                      ? "Đang lập kế hoạch"
                                      : "Đã hủy"
                                  }
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
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
