const sb = window.supabaseClient;

const sectionsContainer = document.getElementById("sectionsContainer");
const addBtn = document.getElementById("addSectionBtn");
const input = document.getElementById("newSectionTitle");
const subjectSelect = document.getElementById("subjectSelect");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const subjectBadge = document.getElementById("currentSubjectBadge");

let currentSubject = null;
let editingSectionId = null;

// URL-ден subject алу
function getSubject() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject");
}

// Пәндер тізімін select-ке жүктеу
async function loadSubjectsToSelect() {
  if (!subjectSelect) return;

  const { data, error } = await sb
    .from("subjects")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Пәндерді жүктеу қатесі:", error);
    return;
  }

  subjectSelect.innerHTML = `<option value="">Пәнді таңдаңыз</option>`;

  data.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject.slug;
    option.textContent = subject.name;
    subjectSelect.appendChild(option);
  });

  const urlSubject = getSubject();

  if (urlSubject) {
    subjectSelect.value = urlSubject;
    currentSubject = urlSubject;
  }
}

// UI жаңарту
function updateSubjectUI() {
  if (!currentSubject) {
    if (pageTitle) pageTitle.textContent = "Пән бөлімдері мен сабақтар";
    if (pageSubtitle) pageSubtitle.textContent = "Алдымен пәнді таңдаңыз";
    if (subjectBadge) subjectBadge.textContent = "Таңдалмаған";

    if (sectionsContainer) {
      sectionsContainer.innerHTML = `<p>Пәнді таңдаңыз</p>`;
    }

    return;
  }

  if (pageTitle) pageTitle.textContent = `${currentSubject} пәнінің бөлімдері`;
  if (pageSubtitle) pageSubtitle.textContent = `Таңдалған пән: ${currentSubject}`;
  if (subjectBadge) subjectBadge.textContent = currentSubject;
}

// Бөлімдерді жүктеу
async function loadSections() {
  if (!currentSubject) {
    updateSubjectUI();
    return;
  }

  const { data, error } = await sb
    .from("sections")
    .select("*")
    .eq("subject", currentSubject)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Бөлімдерді жүктеу қатесі:", error);
    sectionsContainer.innerHTML = `<p>Қате шықты</p>`;
    return;
  }

  renderSections(data);
}

// Бөлімдерді шығару
function renderSections(sections) {
  if (!sectionsContainer) return;

  if (!sections || sections.length === 0) {
    sectionsContainer.innerHTML = "<p>Бұл пәнде әзірге бөлімдер жоқ</p>";
    return;
  }

  sectionsContainer.innerHTML = sections
    .map((section) => {
      return `
        <div class="section-card">
          <h3>${section.title}</h3>
          <p><strong>ID:</strong> ${section.id}</p>

          <div class="section-actions">
            <button
              class="btn-edit-section"
              type="button"
              data-edit-id="${section.id}"
              data-edit-title="${section.title}"
            >
              Өңдеу
            </button>

            <button
              class="btn-delete-section"
              type="button"
              data-delete-id="${section.id}"
            >
              Өшіру
            </button>

            <a
              class="btn-lessons-section"
              href="lesson-editor.html?subject=${currentSubject}&section=${section.id}"
            >
              Сабақтарына өту
            </a>
          </div>
        </div>
      `;
    })
    .join("");

  bindSectionActions();
}

// Бөлім карточка батырмалары
function bindSectionActions() {
  const editButtons = document.querySelectorAll("[data-edit-id]");
  const deleteButtons = document.querySelectorAll("[data-delete-id]");

  editButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.editId;
      const title = button.dataset.editTitle;

      editingSectionId = id;
      input.value = title || "";
      addBtn.textContent = "Өзгерісті сақтау";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deleteId;

      const confirmed = confirm("Бұл бөлімді өшіргіңіз келе ме?");
      if (!confirmed) return;

      await deleteSection(id);
    });
  });
}

// Жаңа бөлім қосу немесе edit сақтау
async function addOrUpdateSection() {
  const title = input.value.trim();

  if (!currentSubject) {
    alert("Алдымен пәнді таңдаңыз");
    return;
  }

  if (!title) {
    alert("Бөлім атауын толтырыңыз");
    return;
  }

  if (editingSectionId) {
    const { error } = await sb
      .from("sections")
      .update({ title })
      .eq("id", editingSectionId);

    if (error) {
      console.error("Бөлімді жаңарту қатесі:", error);
      alert("Бөлімді жаңарту кезінде қате шықты");
      return;
    }

    resetSectionForm();
    await loadSections();
    return;
  }

  const { error } = await sb.from("sections").insert([
    {
      title,
      subject: currentSubject
    }
  ]);

  if (error) {
    console.error("Бөлім қосу қатесі:", error);
    alert("Бөлімді қосу кезінде қате шықты");
    return;
  }

  resetSectionForm();
  await loadSections();
}

// Өшіру
async function deleteSection(sectionId) {
  const { error } = await sb
    .from("sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    console.error("Бөлімді өшіру қатесі:", error);
    alert("Бөлімді өшіру кезінде қате шықты");
    return;
  }

  if (editingSectionId === sectionId) {
    resetSectionForm();
  }

  await loadSections();
}

// Форманы бастапқы күйге келтіру
function resetSectionForm() {
  editingSectionId = null;
  input.value = "";
  addBtn.textContent = "+ Бөлім қосу";
}

// Select өзгергенде
if (subjectSelect) {
  subjectSelect.addEventListener("change", () => {
    const value = subjectSelect.value;

    resetSectionForm();

    if (!value) {
      currentSubject = null;
      updateSubjectUI();
      window.history.replaceState({}, "", "sections.html");
      return;
    }

    currentSubject = value;
    updateSubjectUI();
    window.history.replaceState({}, "", `sections.html?subject=${value}`);
    loadSections();
  });
}

// Қосу батырмасы
if (addBtn) {
  addBtn.addEventListener("click", addOrUpdateSection);
}

// Бастапқы жүктеу
async function initPage() {
  await loadSubjectsToSelect();
  updateSubjectUI();

  if (currentSubject) {
    await loadSections();
  }
}

initPage();