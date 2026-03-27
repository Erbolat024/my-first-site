const sb = window.supabaseClient;

const form = document.getElementById("subject-form");
const messageBox = document.getElementById("form-message");
const subjectsList = document.getElementById("subjects-list");
const reloadBtn = document.getElementById("reload-btn");
const searchInput = document.getElementById("search-input");

let allSubjects = [];

function setMessage(text, type = "") {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.className = "form-message";
  if (type) {
    messageBox.classList.add(type);
  }
}

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

async function checkAdmin() {
  const {
    data: { user },
    error
  } = await sb.auth.getUser();

  if (error || !user) {
    window.location.href = "../../pages/login.html";
    return null;
  }

  return user;
}

function renderSubjects(subjects) {
  if (!subjectsList) return;

  if (!subjects || subjects.length === 0) {
    subjectsList.innerHTML = `<p class="empty-text">Пән табылмады</p>`;
    return;
  }

  subjectsList.innerHTML = subjects
    .map((subject) => {
      return `
        <div class="subject-card">
          <h3>${subject.name}</h3>
          <span class="subject-slug">${subject.slug}</span>

          <p class="subject-description">
            ${subject.description || "Сипаттама енгізілмеген"}
          </p>

          <span class="subject-status ${subject.is_active ? "active" : "inactive"}">
            ${subject.is_active ? "Белсенді" : "Белсенді емес"}
          </span>

          <div class="subject-actions">
            <button class="btn-edit" data-edit-id="${subject.id}" type="button">
              Өңдеу
            </button>

            <button
              class="btn-toggle"
              data-toggle-id="${subject.id}"
              data-current-status="${subject.is_active}"
              type="button"
            >
              ${subject.is_active ? "Белсенді емес ету" : "Белсенді ету"}
            </button>

            <a class="btn-content" href="sections.html?subject=${subject.slug}">
              Контентке өту
            </a>
          </div>
        </div>
      `;
    })
    .join("");

  attachSubjectActions();
}

async function loadSubjects() {
  if (!subjectsList) return;

  subjectsList.innerHTML = `<p class="empty-text">Пәндер жүктелуде...</p>`;

  const { data, error } = await sb
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Қате:", error);
    subjectsList.innerHTML = `<p class="empty-text">Қате шықты</p>`;
    return;
  }

  allSubjects = data;
  renderSubjects(allSubjects);
}

function filterSubjects(query) {
  const q = query.toLowerCase();

  const filtered = allSubjects.filter((s) => {
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  renderSubjects(filtered);
}

async function toggleSubjectStatus(subjectId, currentStatus) {
  const newStatus = currentStatus !== "true";

  const { error } = await sb
    .from("subjects")
    .update({ is_active: newStatus })
    .eq("id", subjectId);

  if (error) {
    alert("Қате шықты");
    return;
  }

  await loadSubjects();
}

function attachSubjectActions() {
  document.querySelectorAll("[data-toggle-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await toggleSubjectStatus(
        btn.dataset.toggleId,
        btn.dataset.currentStatus
      );
    });
  });

  document.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await fillFormForEdit(btn.dataset.editId);
    });
  });
}

async function fillFormForEdit(subjectId) {
  const { data } = await sb
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  document.getElementById("name").value = data.name;
  document.getElementById("slug").value = data.slug;
  document.getElementById("description").value = data.description;
  document.getElementById("is_active").checked = data.is_active;

  form.dataset.editId = data.id;
  setMessage("Өңдеу режимі", "success");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const slug = normalizeSlug(document.getElementById("slug").value);
    const description = document.getElementById("description").value.trim();
    const isActive = document.getElementById("is_active").checked;
    const editId = form.dataset.editId;

    if (!name || !slug) {
      setMessage("Толтыр", "error");
      return;
    }

    if (editId) {
      await sb
        .from("subjects")
        .update({ name, slug, description, is_active: isActive })
        .eq("id", editId);

      delete form.dataset.editId;
      setMessage("Жаңартылды", "success");
    } else {
      await sb.from("subjects").insert([
        { name, slug, description, is_active: isActive }
      ]);

      setMessage("Қосылды", "success");
    }

    form.reset();
    document.getElementById("is_active").checked = true;

    await loadSubjects();
  });
}

if (reloadBtn) {
  reloadBtn.addEventListener("click", loadSubjects);
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const value = e.target.value;

    if (!value) {
      renderSubjects(allSubjects);
    } else {
      filterSubjects(value);
    }
  });
}

async function initPage() {
  await checkAdmin();
  await loadSubjects();
}

initPage();