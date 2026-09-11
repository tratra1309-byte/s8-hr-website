const jobs = [
  {
    title: "SALE ONLINE 1",
    salary: "10M – 15M",
    desc: "Làm việc online, tư vấn và phát triển khách hàng. Thu nhập theo năng lực, hiệu quả và chính sách của vị trí."
  },
  {
    title: "SALE ONLINE 2",
    salary: "15M – 23M",
    desc: "Vị trí Sale Online với mức thu nhập cao hơn, phù hợp ứng viên có kinh nghiệm và khả năng tạo kết quả tốt."
  },
  {
    title: "HR ONLINE",
    salary: "12M + KPI",
    desc: "Phụ trách tuyển dụng online, phát triển nguồn ứng viên và phối hợp xây dựng hệ thống tuyển dụng."
  },
  {
    title: "LEADER TRUYỀN THÔNG",
    salary: "14M – MAX 20M",
    desc: "Quản lý, định hướng và phát triển đội ngũ truyền thông; xây dựng kế hoạch nội dung và quảng bá thương hiệu."
  },
  {
    title: "TELESALE",
    salary: "600$ – MAX 1.000$",
    desc: "Tư vấn và chăm sóc khách hàng qua kênh online. Thu nhập theo năng lực và hiệu quả công việc."
  },
  {
    title: "LEADER TELESALE",
    salary: "1.500$ – 1.800$",
    desc: "Quản lý, đào tạo và phát triển đội ngũ Telesale; theo dõi hiệu suất và hỗ trợ team đạt mục tiêu."
  },
  {
    title: "ĐẠI LÝ",
    salary: "40% – 70% HH",
    desc: "Mô hình hợp tác với chính sách hoa hồng hấp dẫn, phù hợp cá nhân/đối tác muốn phát triển nguồn thu."
  },
  {
    title: "TỔ TRƯỞNG SALE / HLV SALE",
    salary: "1.500$ – 2.000$",
    desc: "Quản lý và đào tạo đội ngũ Sale, xây dựng kế hoạch phát triển nhân sự và kiểm soát hiệu suất team."
  }
];


// =========================
// HIỂN THỊ DANH SÁCH JOB
// =========================

const grid = document.getElementById("job-grid");

jobs.forEach((job, i) => {
  const card = document.createElement("article");

  card.className = "job reveal";

  card.innerHTML = `
    <div class="job-top">
      <div>
        <div class="job-index">0${i + 1} · Vị Trí Tuyển Dụng</div>
        <h3>${job.title}</h3>
      </div>

      <div class="salary">${job.salary}</div>
    </div>

    <p>${job.desc}</p>

    <div class="job-actions">
      <button class="small-btn primary-sm details-btn">
        Xem chi tiết
      </button>

      <a
        class="small-btn"
        href="https://t.me/S8HR1"
        target="_blank"
        rel="noopener"
      >
        Ứng tuyển
      </a>
    </div>
  `;

  card
    .querySelector(".details-btn")
    .addEventListener("click", () => openModal(job));

  grid.appendChild(card);
});


// =========================
// TỰ ĐỘNG TẠO DANH SÁCH
// VỊ TRÍ TRONG FORM
// =========================

const positionSelect = document.querySelector(
  '#apply-form select[name="position"]'
);

if (positionSelect) {
  positionSelect.innerHTML = `
    <option value="">-- Chọn vị trí ứng tuyển --</option>
  `;

  jobs.forEach(job => {
    const option = document.createElement("option");

    option.value = job.title;
    option.textContent = `${job.title} — ${job.salary}`;

    positionSelect.appendChild(option);
  });
}


// =========================
// MODAL CHI TIẾT JOB
// =========================

const modal = document.getElementById("job-modal");
const modalTitle = document.getElementById("modal-title");
const modalSalary = document.getElementById("modal-salary");
const modalDesc = document.getElementById("modal-desc");

function openModal(job) {
  modalTitle.textContent = job.title;
  modalSalary.textContent = job.salary;
  modalDesc.textContent = job.desc;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

document
  .querySelectorAll("[data-close]")
  .forEach(el => el.addEventListener("click", closeModal));

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
  }
});


// =========================
// HIỆU ỨNG SCROLL
// =========================

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.08
  }
);

document
  .querySelectorAll(".reveal")
  .forEach(el => observer.observe(el));


// =========================
// FORM GỬI CV → TELEGRAM
// =========================

const applyForm = document.getElementById("apply-form");
const formStatus = document.getElementById("form-status");

if (applyForm) {
  applyForm.addEventListener("submit", async e => {
    e.preventDefault();

    const btn = applyForm.querySelector(
      "button[type=submit]"
    );

    btn.disabled = true;
    btn.textContent = "ĐANG GỬI...";

    formStatus.textContent = "";

    const data = Object.fromEntries(
      new FormData(applyForm).entries()
    );

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.ok) {
        throw new Error(
          result.message || "Không thể gửi hồ sơ."
        );
      }

      formStatus.textContent =
        "✓ Đã gửi hồ sơ thành công. HR sẽ liên hệ bạn sớm.";

      applyForm.reset();

    } catch (err) {
      formStatus.textContent = "✕ " + err.message;

    } finally {
      btn.disabled = false;
      btn.textContent = "GỬI HỒ SƠ VỀ HR";
    }
  });
}
