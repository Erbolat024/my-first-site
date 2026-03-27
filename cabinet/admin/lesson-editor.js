const sb = window.supabaseClient;

const lessonsContainer = document.getElementById("lessonsContainer");
const addLessonBtn = document.getElementById("addLessonBtn");
const newLessonTitleInput = document.getElementById("newLessonTitle");

const subjectSelect = document.getElementById("subjectSelect");
const sectionSelect = document.getElementById("sectionSelect");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const currentSubjectBadge = document.getElementById("currentSubjectBadge");
const currentSectionBadge = document.getElementById("currentSectionBadge");

let currentSubject = null;
let currentSectionId = null;
let currentSection = null;
let editingLessonId = null;

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    section: params.get("section")
  };
}

async function loadSubjectsToSelect() {
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
}

async function loadSectionsToSelect(subjectSlug) {
  if (!subjectSlug) {
    sectionSelect.innerHTML = `<option value="">Алдымен пәнді таңдаңыз</option>`;
    return;
  }

  const { data, error } = await sb
    .from("sections")
    .select("*")
    .eq("subject", subjectSlug)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Бөлімдерді жүктеу қатесі:", error);
    return;
  }

  sectionSelect.innerHTML = `<option value="">Бөлімді таңдаңыз</option>`;

  data.forEach((section) => {
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = section.title;
    sectionSelect.appendChild(option);
  });
}

async function loadSectionById(sectionId) {
  if (!sectionId) {
    currentSection = null;
    return;
  }

  const { data, error } = await sb
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .single();

  if (error || !data) {
    console.error("Бөлімді жүктеу қатесі:", error);
    currentSection = null;
    return;
  }

  currentSection = data;
}

function updateUI() {
  if (!currentSubject && !currentSection) {
    pageTitle.textContent = "Сабақтар";
    pageSubtitle.textContent = "Пән мен бөлімді таңдап, сабақтарды басқарыңыз";
    currentSubjectBadge.textContent = "Таңдалмаған";
    currentSectionBadge.textContent = "Таңдалмаған";
    lessonsContainer.innerHTML = `<p>Пән мен бөлімді таңдаңыз</p>`;
    return;
  }

  if (currentSubject) {
    currentSubjectBadge.textContent = currentSubject;
  } else {
    currentSubjectBadge.textContent = "Таңдалмаған";
  }

  if (currentSection) {
    currentSectionBadge.textContent = currentSection.title;
    pageTitle.textContent = `${currentSection.title} бөлімінің сабақтары`;
    pageSubtitle.textContent = `Пән: ${currentSubject} | Бөлім: ${currentSection.title}`;
  } else {
    currentSectionBadge.textContent = "Таңдалмаған";
    pageTitle.textContent = "Сабақтар";
    pageSubtitle.textContent = "Пән мен бөлімді таңдап, сабақтарды басқарыңыз";
    lessonsContainer.innerHTML = `<p>Пән мен бөлімді таңдаңыз</p>`;
  }
}

async function loadLessons() {
  if (!currentSectionId) {
    updateUI();
    return;
  }

  const { data, error } = await sb
    .from("lessons")
    .select("*")
    .eq("section_id", currentSectionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Сабақтарды жүктеу қатесі:", error);
    lessonsContainer.innerHTML = `<p>Сабақтарды жүктеу кезінде қате шықты</p>`;
    return;
  }

  renderLessons(data);
}

function renderLessons(lessons) {
  if (!lessons || lessons.length === 0) {
    lessonsContainer.innerHTML = `<p>Бұл бөлімде әзірге сабақтар жоқ</p>`;
    return;
  }

  lessonsContainer.innerHTML = lessons
    .map((lesson) => {
      return `
        <div class="lesson-card">
          <h3>${lesson.title || "Атаусыз сабақ"}</h3>
          <p class="lesson-meta"><strong>ID:</strong> ${lesson.id}</p>
          <p class="lesson-meta"><strong>Section ID:</strong> ${lesson.section_id}</p>

          <div class="lesson-actions">
            <button
              class="btn-edit-lesson"
              type="button"
              data-edit-id="${lesson.id}"
              data-edit-title="${lesson.title || ""}"
            >
              Өңдеу
            </button>

            <button
              class="btn-delete-lesson"
              type="button"
              data-delete-id="${lesson.id}"
            >
              Өшіру
            </button>

            <a
              class="btn-open-lesson"
              href="lesson-content.html?subject=${currentSubject}&section=${currentSectionId}&lesson=${lesson.id}"
            >
              Сабақ ішіне өту
            </a>

            <a
              class="btn-open-test"
              href="test-editor.html?subject=${currentSubject}&section=${currentSectionId}&lesson=${lesson.id}"
            >
              Сабақ тестіне өту
            </a>
          </div>
        </div>
      `;
    })
    .join("");

  bindLessonActions();
}

function bindLessonActions() {
  document.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      editingLessonId = button.dataset.editId;
      newLessonTitleInput.value = button.dataset.editTitle || "";
      addLessonBtn.textContent = "Өзгерісті сақтау";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  });

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const lessonId = button.dataset.deleteId;
      const confirmed = confirm("Бұл сабақты өшіргіңіз келе ме?");
      if (!confirmed) return;

      await deleteLesson(lessonId);
    });
  });
}

async function addOrUpdateLesson() {
  const title = newLessonTitleInput.value.trim();

  if (!currentSubject || !currentSectionId) {
    alert("Алдымен пән мен бөлімді таңдаңыз");
    return;
  }

  if (!title) {
    alert("Сабақ атауын толтырыңыз");
    return;
  }

  if (editingLessonId) {
    const { error } = await sb
      .from("lessons")
      .update({ title })
      .eq("id", editingLessonId);

    if (error) {
      console.error("Сабақты жаңарту қатесі:", error);
      alert("Сабақты жаңарту кезінде қате шықты");
      return;
    }

    resetLessonForm();
    await loadLessons();
    return;
  }

  const { error } = await sb
    .from("lessons")
    .insert([
      {
        title,
        subject: currentSubject,
        section_id: currentSectionId
      }
    ]);

  if (error) {
    console.error("Сабақ қосу қатесі:", error);
    alert("Сабақ қосу кезінде қате шықты");
    return;
  }

  resetLessonForm();
  await loadLessons();
}

async function deleteLesson(lessonId) {
  const { error } = await sb
    .from("lessons")
    .delete()
    .eq("id", lessonId);

  if (error) {
    console.error("Сабақты өшіру қатесі:", error);
    alert("Сабақты өшіру кезінде қате шықты");
    return;
  }

  if (String(editingLessonId) === String(lessonId)) {
    resetLessonForm();
  }

  await loadLessons();
}

function resetLessonForm() {
  editingLessonId = null;
  newLessonTitleInput.value = "";
  addLessonBtn.textContent = "+ Сабақ қосу";
}

subjectSelect.addEventListener("change", async () => {
  currentSubject = subjectSelect.value || null;
  currentSectionId = null;
  currentSection = null;
  resetLessonForm();

  await loadSectionsToSelect(currentSubject);
  updateUI();

  if (!currentSubject) {
    window.history.replaceState({}, "", "lesson-editor.html");
    return;
  }

  window.history.replaceState({}, "", `lesson-editor.html?subject=${currentSubject}`);
});

sectionSelect.addEventListener("change", async () => {
  const value = sectionSelect.value;

  resetLessonForm();

  if (!value) {
    currentSectionId = null;
    currentSection = null;
    updateUI();

    if (currentSubject) {
      window.history.replaceState({}, "", `lesson-editor.html?subject=${currentSubject}`);
    } else {
      window.history.replaceState({}, "", "lesson-editor.html");
    }
    return;
  }

  currentSectionId = Number(value);
  await loadSectionById(currentSectionId);
  updateUI();

  window.history.replaceState(
    {},
    "",
    `lesson-editor.html?subject=${currentSubject}&section=${currentSectionId}`
  );

  await loadLessons();
});

if (addLessonBtn) {
  addLessonBtn.addEventListener("click", addOrUpdateLesson);
}

async function initPage() {
  const { subject, section } = getParams();

  await loadSubjectsToSelect();

  if (subject) {
    currentSubject = subject;
    subjectSelect.value = subject;
    await loadSectionsToSelect(subject);
  }

  if (section) {
    currentSectionId = Number(section);
    sectionSelect.value = section;
    await loadSectionById(currentSectionId);
  }

  updateUI();

  if (currentSectionId) {
    await loadLessons();
  }
}

initPage();