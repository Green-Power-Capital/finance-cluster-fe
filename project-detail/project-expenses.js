// project-expenses.js - Logic xử lý chi phí thực tế từ Hợp đồng (Toàn Thành)

// ================ CONFIGURATION ================
const EXPENSE_CONFIG = {
  // Base URL của API (cần khớp với project-detail.js hoặc cấu hình chung)
  //   BASE_URL: "http://localhost:3000",
  BASE_URL: "https://finance-cluster-be.onrender.com",
  // ID của công ty Toàn Thành (Hardcoded theo yêu cầu)
  BUYER_ID: "64a1b2c3d4e5f67890123456",
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
 * 1. Fetch danh sách hợp đồng chi phí
 */
async function fetchExpenseContracts(projectId) {
  try {
    const url = `${EXPENSE_CONFIG.BASE_URL}${EXPENSE_CONFIG.ENDPOINTS.FILTER_CONTRACTS}?projectId=${projectId}&buyerCompanyId=${EXPENSE_CONFIG.BUYER_ID}&sortOrder=1`;
    console.log("Fetching expenses from:", url);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch contracts");

    return await response.json();
  } catch (error) {
    console.error("Error fetching expense contracts:", error);
    return [];
  }
}

/**
 * 2. Tính toán tổng tiền thực chi từ danh sách hợp đồng
 * Logic: Duyệt qua từng hợp đồng -> Duyệt qua payments -> Cộng payment có status = 'paid'
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
 * 3. Render bảng danh sách hợp đồng
 */
function renderExpenseTable(contracts) {
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

      return `
        <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <td class="p-4 text-sm font-medium text-text-main dark:text-white">
            ${contract.contractNumber}
            <div class="text-xs text-text-secondary dark:text-gray-400 font-normal mt-1">
              ${ExpenseUtils.formatDate(contract.contractDate)}
            </div>
          </td>
          <td class="p-4 text-sm text-text-secondary dark:text-gray-300">
            <div class="font-medium text-text-main dark:text-white mb-1">${
              contract.sellerCompany?.name || "N/A"
            }</div>
            <div class="text-xs">${contract.description}</div>
          </td>
          <td class="p-4 text-sm text-right font-medium text-text-main dark:text-white">
            ${ExpenseUtils.formatCurrency(contract.totalValue)}
          </td>
          <td class="p-4 text-right">
            <div class="text-sm font-bold text-blue-600 dark:text-blue-400">
              ${ExpenseUtils.formatCurrency(paidInContract)}
            </div>
            <div class="text-xs text-text-secondary dark:text-gray-400 mt-1">
              ${progressPercent}%
            </div>
          </td>
          <td class="p-4 text-center">
             <span class="inline-flex px-2 py-1 text-xs rounded-full ${
               paidInContract >= contract.totalValue
                 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                 : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
             }">
               ${paidInContract >= contract.totalValue ? "Đã xong" : "Đang chi"}
             </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
      <div class="mt-8 bg-white dark:bg-[#1a2632] p-6 rounded-xl border border-border-color dark:border-gray-700 shadow-sm animate-fadeIn">
        <h3 class="text-lg font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-blue-600">receipt_long</span>
          Chi tiết các khoản chi Toàn Thành (Dữ liệu thực tế)
        </h3>
        
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
      </div>
    `;
}

/**
 * 4. Cập nhật UI hiện tại (Override số liệu ước tính)
 * Hàm này dùng DOM manipulation để tìm box "Toàn Thành" và sửa số liệu
 */
function updateSummaryCard(realExpense, projectTotalValue) {
  // Tìm tất cả thẻ H3 để xác định vị trí Card "Toàn Thành đã chi"
  const headings = Array.from(document.querySelectorAll("h3"));
  const targetHeading = headings.find((h) =>
    h.textContent.includes("Tổng tiền Toàn Thành đã chi")
  );

  if (targetHeading) {
    // 1. Sửa tiêu đề (Bỏ chữ Ước tính)
    targetHeading.innerHTML = `
        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance</span>
        Tổng tiền Toàn Thành đã chi (Thực tế)
      `;

    // 2. Tìm container cha (Card)
    const card = targetHeading.closest("div");
    if (card) {
      // Tính lại % so với tổng giá trị dự án (projectTotalValue lấy từ DOM cũ hoặc tính lại)
      // Để đơn giản, ta lấy text từ DOM hiện tại của "Giá trị hợp đồng" để parse ra số tổng,
      // hoặc truyền từ main app. Ở đây ta tính % dựa trên tham số truyền vào.

      let percent = 0;
      if (projectTotalValue > 0) {
        percent = ((realExpense / projectTotalValue) * 100).toFixed(1);
      }

      // Cập nhật số tiền lớn (VD: 4.1 Tỷ)
      const valueBigElement = card.querySelector(".text-2xl.font-bold");
      if (valueBigElement)
        valueBigElement.textContent =
          ExpenseUtils.formatCurrencyWithUnit(realExpense);

      // Cập nhật số tiền nhỏ (VD: 4,100,000,000 VNĐ)
      const valueSmallElement = card.querySelector(
        ".text-sm.text-text-secondary.mt-1"
      );
      if (valueSmallElement)
        valueSmallElement.textContent = `${ExpenseUtils.formatCurrency(
          realExpense
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
  }
}

// ================ INITIALIZATION ================

async function initExpenses() {
  const projectId = localStorage.getItem("selectedProjectId");
  if (!projectId) return;

  // Chờ một chút để project-detail.js render xong DOM (vì nó dùng innerHTML)
  // Cách an toàn là dùng MutationObserver, nhưng setTimeout đơn giản cho trường hợp này
  setTimeout(async () => {
    // 1. Fetch dữ liệu
    const contracts = await fetchExpenseContracts(projectId);

    if (contracts.length > 0) {
      // 2. Tính toán
      const { totalPaid } = calculateRealExpenses(contracts);

      // Lấy giá trị Project Total từ DOM hiện tại (để tính %)
      // Trick: Tìm element chứa giá trị tổng HĐ mà project-detail.js đã render
      // (Hoặc có thể gọi lại API project, nhưng ta tận dụng DOM có sẵn)
      let projectTotal = 0;
      const totalTextEl = document.querySelector(
        ".text-xl.font-semibold.text-primary"
      );
      if (totalTextEl) {
        // Remove dấu chấm và parse
        const cleanStr = totalTextEl.textContent.replace(/\./g, "");
        projectTotal = parseFloat(cleanStr) || 0;
      }

      // 3. Cập nhật Card Summary (Ghi đè số liệu ước tính)
      updateSummaryCard(totalPaid, projectTotal);

      // 4. Append Bảng chi tiết vào cuối content
      const contentContainer = document.getElementById("projectDetailContent");
      if (contentContainer) {
        // Tạo một div wrapper cho phần expense
        const expenseSection = document.createElement("div");
        expenseSection.innerHTML = renderExpenseTable(contracts);

        // Chèn vào cuối container chính (trong thẻ animate-fadeIn)
        const mainWrapper = contentContainer.querySelector(".animate-fadeIn");
        if (mainWrapper) {
          mainWrapper.appendChild(expenseSection);
        } else {
          contentContainer.appendChild(expenseSection);
        }
      }
    }
  }, 1000); // Delay 1s để đảm bảo main render xong
}

// Auto run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExpenses);
} else {
  initExpenses();
}
