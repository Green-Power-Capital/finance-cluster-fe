// contract-create.js - Logic trang tạo hợp đồng

// ================ DOM Elements ================
const DOM = {
  // Form elements
  contractForm: document.getElementById("contractForm"),
  projectSelect: document.getElementById("projectId"),
  sellerCompanySelect: document.getElementById("sellerCompanyId"),
  buyerCompanySelect: document.getElementById("buyerCompanyId"),
  addPaymentBtn: document.getElementById("addPaymentBtn"),
  paymentsContainer: document.getElementById("paymentsContainer"),

  // Buttons
  cancelBtn: document.getElementById("cancelBtn"),
  saveDraftBtn: document.getElementById("saveDraftBtn"),
  submitBtn: document.getElementById("submitBtn"),

  // Modals
  loadingOverlay: document.getElementById("loadingOverlay"),
  successModal: document.getElementById("successModal"),
  viewContractBtn: document.getElementById("viewContractBtn"),
  createNewBtn: document.getElementById("createNewBtn"),
};

// ================ Configuration ================
const API_CONFIG = {
  //   BASE_URL: "http://localhost:3000",
  BASE_URL: "https://finance-cluster-be.onrender.com",
  ENDPOINTS: {
    CONTRACTS: "/api/contracts",
    PROJECTS: "/api/projects",
    COMPANIES: "/api/companies",
  },
};

// ================ State Management ================
let createdContractId = null;
let paymentCounter = 1;

// ================ Utility Functions ================

/**
 * Hiển thị loading
 */
function showLoading() {
  DOM.loadingOverlay.classList.remove("hidden");
}

/**
 * Ẩn loading
 */
function hideLoading() {
  DOM.loadingOverlay.classList.add("hidden");
}

/**
 * Hiển thị thông báo lỗi
 */
function showError(message) {
  alert(`Lỗi: ${message}`);
}

/**
 * Format số tiền VNĐ
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Fetch danh sách dự án từ API
 */
async function fetchProjects() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROJECTS}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    showError("Không thể tải danh sách dự án");
    return [];
  }
}

/**
 * Fetch danh sách công ty từ API
 */
async function fetchCompanies() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMPANIES}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const companies = await response.json();
    return companies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    showError("Không thể tải danh sách công ty");
    return [];
  }
}

/**
 * Tạo payment template HTML
 */
function createPaymentTemplate(paymentIndex) {
  return `
      <div class="payment-item bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-border-color dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-medium text-text-main dark:text-white">Thanh toán ${paymentIndex}</h4>
          <button
            type="button"
            class="remove-payment-btn text-red-500 hover:text-red-700 transition-colors"
            data-index="${paymentIndex}"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Payment ID -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Mã thanh toán
            </label>
            <input
              type="text"
              name="payments[${paymentIndex}][paymentId]"
              placeholder="VD: PAY-001"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
  
          <!-- Payment Name -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Tên thanh toán
            </label>
            <input
              type="text"
              name="payments[${paymentIndex}][name]"
              placeholder="VD: Tạm ứng 30%"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
  
          <!-- Amount -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Số tiền (VNĐ)
            </label>
            <input
              type="number"
              name="payments[${paymentIndex}][amount]"
              placeholder="VD: 1000000000"
              min="0"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
  
          <!-- Status -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Trạng thái
            </label>
            <select
              name="payments[${paymentIndex}][status]"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
  
          <!-- Due Date -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Hạn thanh toán
            </label>
            <input
              type="date"
              name="payments[${paymentIndex}][dueDate]"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
  
          <!-- Paid Date -->
          <div>
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Ngày thanh toán
            </label>
            <input
              type="date"
              name="payments[${paymentIndex}][paidDate]"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
  
          <!-- Condition -->
          <div class="md:col-span-2">
            <label class="block text-sm text-text-secondary dark:text-gray-400 mb-2">
              Điều kiện thanh toán
            </label>
            <input
              type="text"
              name="payments[${paymentIndex}][condition]"
              placeholder="VD: Ký hợp đồng và xuất hóa đơn"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            >
          </div>
        </div>
      </div>
    `;
}

/**
 * Thêm payment mới
 */
function addPayment() {
  paymentCounter++;
  const paymentHtml = createPaymentTemplate(paymentCounter);
  DOM.paymentsContainer.insertAdjacentHTML("beforeend", paymentHtml);

  // Gắn sự kiện xóa payment
  const newPayment = DOM.paymentsContainer.lastElementChild;
  const removeBtn = newPayment.querySelector(".remove-payment-btn");
  removeBtn.addEventListener("click", () => removePayment(paymentCounter));
}

/**
 * Xóa payment
 */
function removePayment(paymentIndex) {
  const paymentItem = document
    .querySelector(`[data-index="${paymentIndex}"]`)
    ?.closest(".payment-item");
  if (paymentItem) {
    paymentItem.remove();
  }
}

/**
 * Chuyển đổi FormData thành object
 */
function formDataToObject(formData) {
  const data = {};

  // Xử lý các field thông thường
  for (const [key, value] of formData.entries()) {
    if (key.includes("[")) {
      // Xử lý mảng (payments)
      const match = key.match(/^(\w+)\[(\d+)\]\[(\w+)\]$/);
      if (match) {
        const [, arrayName, index, prop] = match;
        if (!data[arrayName]) data[arrayName] = [];
        if (!data[arrayName][index]) data[arrayName][index] = {};
        data[arrayName][index][prop] = value;
      }
    } else {
      // Xử lý field thông thường
      data[key] = value;
    }
  }

  // Chuyển đổi payments array
  if (data.payments) {
    data.payments = Object.values(data.payments).filter(
      (payment) => payment.paymentId || payment.name || payment.amount
    );
  }

  return data;
}

/**
 * Tạo hợp đồng mới
 */
async function createContract(contractData) {
  try {
    showLoading();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTRACTS}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating contract:", error);
    throw error;
  } finally {
    hideLoading();
  }
}

/**
 * Điền dữ liệu vào select
 */
function populateSelect(
  selectElement,
  data,
  valueKey = "_id",
  labelKey = "name",
  defaultOption = ""
) {
  selectElement.innerHTML = defaultOption;

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    selectElement.appendChild(option);
  });
}

/**
 * Khởi tạo dữ liệu form
 */
async function initFormData() {
  try {
    showLoading();

    // Load projects
    const projects = await fetchProjects();
    populateSelect(
      DOM.projectSelect,
      projects,
      "_id",
      "name",
      '<option value="">Chọn dự án</option>'
    );

    // Load companies
    const companies = await fetchCompanies();
    populateSelect(
      DOM.sellerCompanySelect,
      companies,
      "_id",
      "name",
      '<option value="">Chọn công ty bán</option>'
    );

    // Thêm mặc định bên mua là TOÀN THÀNH hoặc LÂM VŨ
    const buyer = companies.filter(
      (c) => c.name.includes("TOÀN THÀNH") || c.name.includes("LÂM VŨ")
    );
    if (buyer) {
      populateSelect(
        DOM.buyerCompanySelect,
        buyer,
        "_id",
        "name",
        '<option value="">Chọn công ty mua</option>'
      );
    }

    // Thêm payment mặc định
    addPayment();
  } catch (error) {
    console.error("Error initializing form data:", error);
    showError("Không thể tải dữ liệu khởi tạo");
  } finally {
    hideLoading();
  }
}

/**
 * Xử lý submit form
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  try {
    const formData = new FormData(DOM.contractForm);
    const contractData = formDataToObject(formData);

    console.log("Contract data:", contractData);

    // Validate
    if (
      !contractData.contractNumber ||
      !contractData.contractDate ||
      !contractData.projectId
    ) {
      showError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Convert string dates to ISO strings
    if (contractData.contractDate) {
      contractData.contractDate = new Date(
        contractData.contractDate
      ).toISOString();
    }

    // Convert payments dates
    if (contractData.payments && Array.isArray(contractData.payments)) {
      contractData.payments = contractData.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        dueDate: payment.dueDate
          ? new Date(payment.dueDate).toISOString()
          : null,
        paidDate: payment.paidDate
          ? new Date(payment.paidDate).toISOString()
          : null,
        status: payment.status || "pending",
      }));
    }

    // Convert totalValue to number
    contractData.totalValue = Number(contractData.totalValue);

    // Set default paid/unpaid amounts
    contractData.paidAmount = 0;
    contractData.unpaidAmount = contractData.totalValue;

    console.log("Final contract data:", contractData);

    // Create contract
    const result = await createContract(contractData);

    console.log("result", result);

    if (result && result.success === true) {
      createdContractId = result._id;
      DOM.successModal.classList.remove("hidden");
    } else {
      showError("Không thể tạo hợp đồng");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    showError(error.message || "Có lỗi xảy ra khi tạo hợp đồng");
  }
}

/**
 * Reset form
 */
function resetForm() {
  DOM.contractForm.reset();
  DOM.paymentsContainer.innerHTML = "";
  paymentCounter = 0;
  addPayment();
}

/**
 * Khởi tạo event listeners
 */
function initEventListeners() {
  // Thêm payment
  DOM.addPaymentBtn.addEventListener("click", addPayment);

  // Cancel button
  DOM.cancelBtn.addEventListener("click", () => {
    if (
      confirm("Bạn có chắc chắn muốn hủy? Tất cả dữ liệu chưa lưu sẽ bị mất.")
    ) {
      window.location.href = "index.html";
    }
  });

  // Save draft button
  DOM.saveDraftBtn.addEventListener("click", () => {
    alert("Tính năng Lưu nháp đang được phát triển!");
  });

  // Form submit
  DOM.contractForm.addEventListener("submit", handleFormSubmit);

  // Success modal buttons
  DOM.viewContractBtn.addEventListener("click", () => {
    if (createdContractId) {
      window.location.href = `contract-detail.html?id=${createdContractId}`;
    }
  });

  DOM.createNewBtn.addEventListener("click", () => {
    DOM.successModal.classList.add("hidden");
    resetForm();
  });
}

// ================ Initialization ================

/**
 * Khởi tạo ứng dụng
 */
async function initContractCreate() {
  try {
    console.log("Initializing contract create page...");

    // Khởi tạo event listeners
    initEventListeners();

    // Load initial data
    await initFormData();

    console.log("Contract create page initialized successfully");
  } catch (error) {
    console.error("Error initializing contract create page:", error);
    showError("Không thể khởi tạo trang tạo hợp đồng");
  }
}

// Khởi chạy ứng dụng khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractCreate);
} else {
  initContractCreate();
}
