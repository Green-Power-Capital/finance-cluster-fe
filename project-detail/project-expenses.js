// project-expenses.js - Logic xử lý chi phí thực tế từ Hợp đồng (Toàn Thành & Lâm Vũ)

// ================ CONFIGURATION ================
const EXPENSE_CONFIG = {
  // Base URL của API (cần khớp với project-detail.js hoặc cấu hình chung)
  //   BASE_URL: "http://localhost:3000",
  BASE_URL: "https://finance-cluster-be.onrender.com",
  // ID của công ty Toàn Thành (Hardcoded theo yêu cầu)
  BUYER_ID_TOANTHANH: "64a1b2c3d4e5f67890123456",
  // ID của công ty Lâm Vũ (Cần cập nhật với ID thực tế từ database)
  BUYER_ID_LAMVU: "64a1b2c3d4e5f67890123457", // Thay bằng ID thực tế của Lâm Vũ
  ENDPOINTS: {
    FILTER_CONTRACTS: "/api/contracts/filter",
  },
};

// ================ UTILITY FUNCTIONS (Local) ================
// Copy lại các hàm format để file này hoạt động độc lập
const ExpenseUtils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  },

  formatCurrencyWithUnit: (amount) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return "0";
    let result = "";
    let unit = "";
    if (num >= 1000000000) {
      result = parseFloat((num / 1000000000).toFixed(2))
        .toString()
        .replace(".", ",");
      unit = " Tỷ";
    } else if (num >= 1000000) {
      result = parseFloat((num / 1000000).toFixed(2))
        .toString()
        .replace(".", ",");
      unit = " Triệu";
    } else {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return `${result}${unit}`;
  },

  formatDate: (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (e) {
      return dateString;
    }
  },
};

// ================ CORE LOGIC ================

/**
 * 1. Fetch danh sách hợp đồng chi phí theo buyerId
 */
async function fetchExpenseContracts(projectId, buyerId, companyName = "") {
  try {
    const url = `${EXPENSE_CONFIG.BASE_URL}${EXPENSE_CONFIG.ENDPOINTS.FILTER_CONTRACTS}?projectId=${projectId}&buyerCompanyId=${buyerId}&sortOrder=1`;
    console.log(`Fetching ${companyName} expenses from:`, url);

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch ${companyName} contracts`);

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${companyName} expense contracts:`, error);
    return [];
  }
}

/**
 * 2. Tính toán tổng tiền thực chi từ danh sách hợp đồng
 */
function calculateRealExpenses(contracts) {
  let totalPaid = 0;
  let totalContractValue = 0;

  contracts.forEach((contract) => {
    totalContractValue += contract.totalValue || 0;

    if (contract.payments && Array.isArray(contract.payments)) {
      const paidAmount = contract.payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      totalPaid += paidAmount;
    }
  });

  return { totalPaid, totalContractValue };
}

/**
 * 3.1 Render dropdown chi tiết các lần thanh toán
 */
function renderPaymentsDropdown(payments, contractNumber) {
  if (!payments || payments.length === 0) return "";

  const hasMultiplePayments = payments.length > 1;
  const dropdownId = `payments-${contractNumber.replace(/\s+/g, "-")}`;

  let paymentsHtml = "";

  if (hasMultiplePayments) {
    // Nếu có nhiều hơn 1 payment, hiển thị dropdown
    paymentsHtml = `
      <div class="mt-2">
        <button 
          type="button" 
          class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          onclick="togglePaymentsDropdown('${dropdownId}')"
        >
          <span class="material-symbols-outlined text-sm">expand_more</span>
          Xem ${payments.length} lần thanh toán
        </button>
        <div id="${dropdownId}" class="hidden mt-2 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-3">
          ${payments
            .map(
              (payment, index) => `
            <div class="text-xs">
              <div class="flex justify-between items-center">
                <span class="font-medium text-text-main dark:text-gray-300">
                  Lần ${index + 1}: ${payment.name || "Thanh toán"}
                </span>
                <span class="font-semibold ${
                  payment.status === "paid"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }">
                  ${ExpenseUtils.formatCurrency(payment.amount)}
                </span>
              </div>
              <div class="flex justify-between mt-1 text-text-secondary dark:text-gray-500">
                <div>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                    payment.status === "paid"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }">
                    <span class="material-symbols-outlined text-xs mr-1">
                      ${payment.status === "paid" ? "check_circle" : "pending"}
                    </span>
                    ${
                      payment.status === "paid"
                        ? "Đã thanh toán"
                        : "Chờ thanh toán"
                    }
                  </span>
                </div>
                <div>
                  ${
                    payment.paidDate
                      ? ExpenseUtils.formatDate(payment.paidDate)
                      : payment.dueDate
                      ? `Hạn: ${ExpenseUtils.formatDate(payment.dueDate)}`
                      : ""
                  }
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  } else if (payments.length === 1) {
    // Nếu chỉ có 1 payment, hiển thị trực tiếp
    paymentsHtml = ``;
  }

  return paymentsHtml;
}

/**
 * 3.2 Render bảng danh sách hợp đồng cho một công ty
 */
function renderExpenseTable(
  contracts,
  companyName = "Công ty",
  companyColor = "blue"
) {
  if (!contracts || contracts.length === 0) return "";

  const rows = contracts
    .map((contract) => {
      // Tính đã chi cho từng hợp đồng riêng lẻ
      const paidInContract = (contract.payments || [])
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);

      const progressPercent =
        contract.totalValue > 0
          ? ((paidInContract / contract.totalValue) * 100).toFixed(1)
          : 0;

      // Xác định trạng thái và styling
      const isCompleted = paidInContract >= (contract.totalValue || 0);
      const statusText = isCompleted ? "Đã xong" : "Đang chi";

      // Style cho trạng thái "Đang chi" với animation
      let statusClass = "";
      if (isCompleted) {
        statusClass =
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      } else {
        // Style đặc biệt cho "Đang chi" với animation
        statusClass = `bg-${companyColor}-100 text-${companyColor}-700 dark:bg-${companyColor}-900/30 dark:text-${companyColor}-400 relative overflow-hidden`;
      }

      // Render dropdown payments
      const paymentsHtml = renderPaymentsDropdown(
        contract.payments || [],
        contract.contractNumber || contract._id
      );

      return `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <td class="p-4 text-sm font-medium text-text-main dark:text-white">
            ${contract.contractNumber || "N/A"}
            <div class="text-xs text-text-secondary dark:text-gray-400 font-normal mt-1">
              ${ExpenseUtils.formatDate(contract.contractDate)}
            </div>
          </td>
          <td class="p-4 text-sm text-text-secondary dark:text-gray-300">
            <div class="font-medium text-text-main dark:text-white mb-1">${
              contract.sellerCompany?.name || "N/A"
            }</div>
            <div class="text-xs">${
              contract.description || "Không có mô tả"
            }</div>
            ${paymentsHtml}
          </td>
          <td class="p-4 text-sm text-right font-medium text-text-main dark:text-white">
            ${ExpenseUtils.formatCurrency(contract.totalValue || 0)}
          </td>
          <td class="p-4 text-right">
            <div class="text-sm font-bold text-${companyColor}-600 dark:text-${companyColor}-400">
              ${ExpenseUtils.formatCurrency(paidInContract)}
            </div>
            <div class="text-xs text-text-secondary dark:text-gray-400 mt-1">
              ${progressPercent}%
            </div>
          </td>
          <td class="p-4 text-center">
             <span class="inline-flex items-center px-3 py-1 text-xs rounded-full ${statusClass}">
               ${
                 isCompleted
                   ? ""
                   : `
                 <span class="inline-flex mr-2">
                   <span class="animate-ping absolute h-3 w-3 rounded-full bg-${companyColor}-400 opacity-75"></span>
                   <span class="relative inline-flex rounded-full h-3 w-3 bg-${companyColor}-500"></span>
                 </span>
               `
               }
               ${statusText}
             </span>
          </td>
        </tr>
      `;
    })
    .join("");

  // Xác định icon và màu sắc theo công ty
  let icon = "receipt_long";
  let iconColor = "text-blue-600";

  if (companyName.includes("Lâm Vũ")) {
    icon = "account_balance_wallet";
    iconColor = "text-purple-600";
  }

  return `
      <div class="mt-8 bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm animate-fadeIn">
        <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined ${iconColor}">${icon}</span>
          Chi tiết các khoản chi ${companyName} (Dữ liệu thực tế)
        </h3>
        
        ${
          contracts.length === 0
            ? `
          <div class="text-center py-8 text-text-secondary dark:text-gray-400">
            <span class="material-symbols-outlined text-3xl mb-2">receipt</span>
            <p>Không có hợp đồng chi phí nào</p>
          </div>
        `
            : `
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-text-secondary dark:text-gray-400">
                  <th class="p-4 rounded-tl-lg">Số Hợp đồng</th>
                  <th class="p-4">Nhà cung cấp / Nội dung</th>
                  <th class="p-4 text-right">Giá trị HĐ</th>
                  <th class="p-4 text-right">Đã thanh toán</th>
                  <th class="p-4 text-center rounded-tr-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    `;
}

/**
 * 4. Cập nhật UI hiện tại (Override số liệu ước tính)
 */
function updateSummaryCards(toanThanhExpense, lamVuExpense, projectTotalValue) {
  // Cập nhật card Toàn Thành
  const headings = Array.from(document.querySelectorAll("h3"));

  // 1. Cập nhật card Toàn Thành
  const toanThanhHeading = headings.find((h) =>
    h.textContent.includes("Tổng tiền Toàn Thành đã chi")
  );

  if (toanThanhHeading) {
    toanThanhHeading.innerHTML = `
        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance</span>
        Tổng tiền Toàn Thành đã chi (Thực tế)
      `;

    const toanThanhCard = toanThanhHeading.closest("div");
    if (toanThanhCard && projectTotalValue > 0) {
      const toanThanhPercent = (
        (toanThanhExpense / projectTotalValue) *
        100
      ).toFixed(1);
      updateCardContent(toanThanhCard, toanThanhExpense, toanThanhPercent);
    }
  }

  // 2. Cập nhật card Lâm Vũ
  const lamVuHeading = headings.find((h) =>
    h.textContent.includes("Tổng tiền Lâm Vũ đã chi")
  );

  if (lamVuHeading) {
    lamVuHeading.innerHTML = `
        <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">account_balance_wallet</span>
        Tổng tiền Lâm Vũ đã chi (Thực tế)
      `;

    const lamVuCard = lamVuHeading.closest("div");
    if (lamVuCard && projectTotalValue > 0) {
      const lamVuPercent = ((lamVuExpense / projectTotalValue) * 100).toFixed(
        1
      );
      updateCardContent(lamVuCard, lamVuExpense, lamVuPercent);
    }
  }
}

/**
 * 4.1 Hàm hỗ trợ cập nhật nội dung card
 */
function updateCardContent(card, expense, percent) {
  // Cập nhật số tiền lớn
  const valueBigElement = card.querySelector(".text-2xl.font-bold");
  if (valueBigElement)
    valueBigElement.textContent = ExpenseUtils.formatCurrencyWithUnit(expense);

  // Cập nhật số tiền nhỏ
  const valueSmallElement = card.querySelector(
    ".text-sm.text-text-secondary.mt-1"
  );
  if (valueSmallElement)
    valueSmallElement.textContent = `${ExpenseUtils.formatCurrency(
      expense
    )} VNĐ`;

  // Cập nhật % text
  const percentTextElement = card.querySelector(
    ".text-right .text-2xl.font-bold"
  );
  if (percentTextElement) percentTextElement.textContent = `${percent}%`;

  // Cập nhật thanh Progress Bar
  const progressBar = card.querySelector(".bg-gradient-to-r");
  if (progressBar) progressBar.style.width = `${percent}%`;
}

/**
 * 5. Hàm toggle dropdown (phải đặt ở global scope để onclick gọi được)
 */
function togglePaymentsDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.classList.toggle("hidden");

    // Toggle icon mũi tên
    const button = dropdown.previousElementSibling;
    if (button) {
      const icon = button.querySelector(".material-symbols-outlined");
      if (icon) {
        if (dropdown.classList.contains("hidden")) {
          icon.textContent = "expand_more";
        } else {
          icon.textContent = "expand_less";
        }
      }
    }
  }
}

// ================ INITIALIZATION ================

async function initExpenses() {
  const projectId = localStorage.getItem("selectedProjectId");
  if (!projectId) return;

  // Chờ một chút để project-detail.js render xong DOM
  setTimeout(async () => {
    try {
      // 1. Fetch dữ liệu cho cả hai công ty
      console.log("Đang tải dữ liệu chi phí thực tế...");

      const [toanThanhContracts, lamVuContracts] = await Promise.all([
        fetchExpenseContracts(
          projectId,
          EXPENSE_CONFIG.BUYER_ID_TOANTHANH,
          "Toàn Thành"
        ),
        fetchExpenseContracts(
          projectId,
          EXPENSE_CONFIG.BUYER_ID_LAMVU,
          "Lâm Vũ"
        ),
      ]);

      console.log(`Toàn Thành: ${toanThanhContracts.length} hợp đồng`);
      console.log(`Lâm Vũ: ${lamVuContracts.length} hợp đồng`);

      // 2. Tính toán tổng chi phí
      const { totalPaid: toanThanhExpense } =
        calculateRealExpenses(toanThanhContracts);
      const { totalPaid: lamVuExpense } = calculateRealExpenses(lamVuContracts);

      // 3. Lấy giá trị Project Total từ DOM
      let projectTotal = 0;
      const totalTextEl = document.querySelector(
        ".text-xl.font-semibold.text-primary"
      );
      if (totalTextEl) {
        const cleanStr = totalTextEl.textContent.replace(/\./g, "");
        projectTotal = parseFloat(cleanStr) || 0;
      }

      // 4. Cập nhật Card Summary (Ghi đè số liệu ước tính)
      updateSummaryCards(toanThanhExpense, lamVuExpense, projectTotal);

      // 5. Append các bảng chi tiết vào cuối content
      const contentContainer = document.getElementById("projectDetailContent");
      if (contentContainer) {
        const expenseSection = document.createElement("div");
        expenseSection.className = "expense-tables-container";

        // Thêm bảng Toàn Thành
        expenseSection.innerHTML += renderExpenseTable(
          toanThanhContracts,
          "Toàn Thành",
          "blue"
        );

        // Thêm bảng Lâm Vũ
        expenseSection.innerHTML += renderExpenseTable(
          lamVuContracts,
          "Lâm Vũ",
          "purple"
        );

        const mainWrapper = contentContainer.querySelector(".animate-fadeIn");
        if (mainWrapper) {
          mainWrapper.appendChild(expenseSection);
        } else {
          contentContainer.appendChild(expenseSection);
        }

        console.log("✅ Đã tải xong dữ liệu chi phí thực tế");
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chi phí:", error);
    }
  }, 1000);
}

// Auto run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExpenses);
} else {
  initExpenses();
}
