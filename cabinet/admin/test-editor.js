const sb = window.supabaseClient;

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

const subjectBadge = document.getElementById("subjectBadge");
const sectionBadge = document.getElementById("sectionBadge");
const lessonBadge = document.getElementById("lessonBadge");

const questionInput = document.getElementById("questionInput");
const optionA = document.getElementById("optionA");
const optionB = document.getElementById("optionB");
const optionC = document.getElementById("optionC");
const optionD = document.getElementById("optionD");
const correctAnswer = document.getElementById("correctAnswer");

const saveTestBtn = document.getElementById("saveTestBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const backToLessonBtn = document.getElementById("backToLessonBtn");
const testsContainer = document.getElementById("testsContainer");

let currentSubject = null;
let currentSectionId = null;
let currentLessonId = null;

let currentSection = null;
let currentLesson = null;
let editingTestId = null;

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    section: params.get("section"),
    lesson: params.get("lesson")
  };
}

async function loadSection(sectionId) {
  const { data, error } = await sb
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .single();

  if (error || !data) {
    console.error("Бөлімді жүктеу қатесі:", error);
    return null;
  }

  return data;
}

async function loadLesson(lessonId) {
  const { data, error } = await sb
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (error || !data) {
    console.error("Сабақты жүктеу қатесі:", error);
    return null;
  }

  return data;
}

async function initContext() {
  const { subject, section, lesson } = getParams();

  if (!subject || !section || !lesson) {
    alert("Пән, бөлім немесе сабақ параметрі жоқ");
    window.location.href = "lesson-editor.html";
    return false;
  }

  currentSubject = subject;
  currentSectionId = Number(section);
  currentLessonId = Number(lesson);

  currentSection = await loadSection(currentSectionId);
  currentLesson = await loadLesson(currentLessonId);

  if (!currentLesson) {
    alert("Сабақ табылмады");
    window.location.href = `lesson-editor.html?subject=${subject}&section=${section}`;
    return false;
  }

  if (pageTitle) {
    pageTitle.textContent = `${currentLesson.title || "Сабақ"} тесттері`;
  }

  if (pageSubtitle) {
    pageSubtitle.textContent =
      `Пән: ${subject} | Бөлім: ${currentSection ? currentSection.title : section} | Сабақ: ${currentLesson.title || lesson}`;
  }

  if (subjectBadge) {
    subjectBadge.textContent = subject;
  }

  if (sectionBadge) {
    sectionBadge.textContent = currentSection ? currentSection.title : `ID: ${section}`;
  }

  if (lessonBadge) {
    lessonBadge.textContent = currentLesson.title || `ID: ${lesson}`;
  }

  if (backToLessonBtn) {
    backToLessonBtn.href = `lesson-editor.html?subject=${subject}&section=${section}`;
  }

  return true;
}

async function loadTests() {
  const { data, error } = await sb
    .from("tests")
    .select("*")
    .eq("lesson_id", currentLessonId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Тесттерді жүктеу қатесі:", error);
    testsContainer.innerHTML = `<p>Тесттерді жүктеу кезінде қате шықты</p>`;
    return;
  }

  renderTests(data);
}

function getOptionValue(options, key) {
  if (!options) return "";
  return options[key] || "";
}

function renderTests(tests) {
  if (!tests || tests.length === 0) {
    testsContainer.innerHTML = `<p>Бұл сабақта әзірге тест сұрақтары жоқ</p>`;
    return;
  }

  testsContainer.innerHTML = tests
    .map((test, index) => {
      const options = test.options || {};

      return `
        <div class="test-card">
          <h3>${index + 1}. ${test.question || "Сұрақ жоқ"}</h3>

          <div class="test-options">
            <div class="test-option ${test.correct === "A" ? "correct-option" : ""}">
              A) ${getOptionValue(options, "A")}
            </div>
            <div class="test-option ${test.correct === "B" ? "correct-option" : ""}">
              B) ${getOptionValue(options, "B")}
            </div>
            <div class="test-option ${test.correct === "C" ? "correct-option" : ""}">
              C) ${getOptionValue(options, "C")}
            </div>
            <div class="test-option ${test.correct === "D" ? "correct-option" : ""}">
              D) ${getOptionValue(options, "D")}
            </div>
          </div>

          <p><strong>Дұрыс жауап:</strong> ${test.correct || "-"}</p>
          <p><strong>Реті:</strong> ${test.sort_order ?? "-"}</p>

          <div class="test-actions">
            <button
              class="btn-edit-test"
              type="button"
              data-edit-id="${test.id}"
            >
              Өңдеу
            </button>

            <button
              class="btn-delete-test"
              type="button"
              data-delete-id="${test.id}"
            >
              Өшіру
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  bindTestActions(tests);
}

function bindTestActions(tests) {
  document.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.editId);
      const test = tests.find((item) => item.id === id);
      if (!test) return;

      const options = test.options || {};

      editingTestId = test.id;

      questionInput.value = test.question || "";
      optionA.value = getOptionValue(options, "A");
      optionB.value = getOptionValue(options, "B");
      optionC.value = getOptionValue(options, "C");
      optionD.value = getOptionValue(options, "D");
      correctAnswer.value = test.correct || "";

      saveTestBtn.textContent = "Өзгерісті сақтау";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  });

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.deleteId);
      const confirmed = confirm("Бұл тест сұрағын өшіргіңіз келе ме?");
      if (!confirmed) return;

      await deleteTest(id);
    });
  });
}

function validateForm() {
  if (!questionInput.value.trim()) {
    alert("Сұрақты толтырыңыз");
    return false;
  }

  if (
    !optionA.value.trim() ||
    !optionB.value.trim() ||
    !optionC.value.trim() ||
    !optionD.value.trim()
  ) {
    alert("Барлық жауап нұсқаларын толтырыңыз");
    return false;
  }

  if (!correctAnswer.value) {
    alert("Дұрыс жауапты таңдаңыз");
    return false;
  }

  return true;
}

async function getNextSortOrder() {
  const { data, error } = await sb
    .from("tests")
    .select("sort_order")
    .eq("lesson_id", currentLessonId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 1;
  }

  return (data[0].sort_order || 0) + 1;
}

async function saveTest() {
  if (!validateForm()) return;

  const payload = {
    lesson_id: currentLessonId,
    question: questionInput.value.trim(),
    options: {
      A: optionA.value.trim(),
      B: optionB.value.trim(),
      C: optionC.value.trim(),
      D: optionD.value.trim()
    },
    correct: correctAnswer.value
  };

  if (editingTestId) {
    const { error } = await sb
      .from("tests")
      .update(payload)
      .eq("id", editingTestId);

    if (error) {
      console.error("Тестті жаңарту қатесі:", error);
      alert("Тестті жаңарту кезінде қате шықты");
      return;
    }

    resetForm();
    await loadTests();
    return;
  }

  payload.sort_order = await getNextSortOrder();

  const { error } = await sb
    .from("tests")
    .insert([payload]);

  if (error) {
    console.error("Тест қосу қатесі:", error);
    alert("Тест қосу кезінде қате шықты");
    return;
  }

  resetForm();
  await loadTests();
}

async function deleteTest(testId) {
  const { error } = await sb
    .from("tests")
    .delete()
    .eq("id", testId);

  if (error) {
    console.error("Тестті өшіру қатесі:", error);
    alert("Тестті өшіру кезінде қате шықты");
    return;
  }

  if (editingTestId === testId) {
    resetForm();
  }

  await loadTests();
}

function resetForm() {
  editingTestId = null;
  questionInput.value = "";
  optionA.value = "";
  optionB.value = "";
  optionC.value = "";
  optionD.value = "";
  correctAnswer.value = "";
  saveTestBtn.textContent = "+ Сұрақ қосу";
}

if (saveTestBtn) {
  saveTestBtn.addEventListener("click", saveTest);
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetForm);
}

async function initPage() {
  const ok = await initContext();
  if (!ok) return;

  await loadTests();
}

initPage();