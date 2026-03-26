const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const lessonMeta = document.getElementById("lessonMeta");
const lessonTitleInput = document.getElementById("lessonTitle");
const lessonDescriptionInput = document.getElementById("lessonDescription");
const lessonVideoInput = document.getElementById("lessonVideo");
const lessonContentInput = document.getElementById("lessonContent");
const saveLessonBtn = document.getElementById("saveLessonBtn");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionsContainer = document.getElementById("questionsContainer");

const params = new URLSearchParams(window.location.search);
const subject = params.get("subject");
const sectionId = params.get("section");
const lessonId = params.get("id");

let currentLesson = null;
let currentQuestions = [];

async function initEditor() {
  if (!subject || !lessonId) {
    lessonMeta.textContent = "Параметрлер қате берілген";
    return;
  }

  await loadLesson();
  await loadQuestions();
}

async function loadLesson() {
  const { data, error } = await supabaseClient
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (error) {
    console.error(error);
    lessonMeta.textContent = "Сабақ жүктелмеді";
    return;
  }

  currentLesson = data;

  lessonMeta.textContent = `${subject} • Бөлім ${sectionId} • Сабақ ID ${lessonId}`;
  lessonTitleInput.value = currentLesson.title || "";
  lessonDescriptionInput.value = currentLesson.description || "";
  lessonVideoInput.value = currentLesson.video || "";
  lessonContentInput.value = currentLesson.content || "";
}

async function loadQuestions() {
  const { data, error } = await supabaseClient
    .from("tests")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    currentQuestions = [];
    renderQuestions();
    return;
  }

  currentQuestions = data || [];
  renderQuestions();
}

function renderQuestions() {
  questionsContainer.innerHTML = "";

  if (!currentQuestions.length) {
    questionsContainer.innerHTML = `
      <div class="empty-state">
        <p>Бұл сабаққа тест сұрақтары әлі қосылмаған.</p>
      </div>
    `;
    return;
  }

  currentQuestions.forEach((question, index) => {
    const options = normalizeOptions(question.options);
    const correct = question.correct || "A";

    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = `
      <div class="question-top">
        <h3>Сұрақ ${index + 1}</h3>
        <div class="question-actions">
          <button class="btn secondary save-question-btn" data-id="${question.id}">Сақтау</button>
          <button class="btn danger delete-question-btn" data-id="${question.id}">Өшіру</button>
        </div>
      </div>

      <div class="form-group">
        <label>Сұрақ мәтіні</label>
        <textarea class="question-text" data-id="${question.id}" rows="3">${escapeHtml(question.question || "")}</textarea>
      </div>

      <div class="options-wrap">
        ${["A", "B", "C", "D"].map(letter => `
          <div class="option-row">
            <div class="option-badge">${letter}</div>
            <input
              type="text"
              class="option-input"
              data-id="${question.id}"
              data-option="${letter}"
              value="${escapeHtml(options[letter] || "")}"
              placeholder="${letter} жауабы"
            />
          </div>
        `).join("")}
      </div>

      <div class="correct-answer-box">
        <label>Дұрыс жауап</label>
        <div class="correct-answer-options">
          ${["A", "B", "C", "D"].map(letter => `
            <label>
              <input
                type="radio"
                name="correct-${question.id}"
                class="correct-answer-radio"
                data-id="${question.id}"
                value="${letter}"
                ${correct === letter ? "checked" : ""}
              />
              ${letter}
            </label>
          `).join("")}
        </div>
      </div>
    `;

    questionsContainer.appendChild(card);
  });

  attachQuestionEvents();
}

function attachQuestionEvents() {
  document.querySelectorAll(".save-question-btn").forEach(btn => {
    btn.addEventListener("click", async (event) => {
      const questionId = Number(event.target.dataset.id);
      await saveQuestion(questionId);
    });
  });

  document.querySelectorAll(".delete-question-btn").forEach(btn => {
    btn.addEventListener("click", async (event) => {
      const questionId = Number(event.target.dataset.id);
      await deleteQuestion(questionId);
    });
  });
}

async function saveLesson() {
  if (!currentLesson) return;

  const payload = {
    title: lessonTitleInput.value.trim(),
    description: lessonDescriptionInput.value.trim(),
    content: lessonContentInput.value.trim(),
    video: lessonVideoInput.value.trim()
  };

  const { error } = await supabaseClient
    .from("lessons")
    .update(payload)
    .eq("id", lessonId);

  if (error) {
    console.error(error);
    alert("Сабақ сақталмады");
    return;
  }

  alert("Сабақ сақталды");
}

async function addQuestion() {
  const nextSort = currentQuestions.length
    ? Math.max(...currentQuestions.map(q => q.sort_order || 0)) + 1
    : 1;

  const { error } = await supabaseClient
    .from("tests")
    .insert([{
      lesson_id: Number(lessonId),
      question: "",
      options: {
        A: "",
        B: "",
        C: "",
        D: ""
      },
      correct: "A",
      sort_order: nextSort
    }]);

  if (error) {
    console.error(error);
    alert("Сұрақ қосылмады");
    return;
  }

  await loadQuestions();
}

async function saveQuestion(questionId) {
  const questionTextEl = document.querySelector(`.question-text[data-id="${questionId}"]`);
  const optionEls = document.querySelectorAll(`.option-input[data-id="${questionId}"]`);
  const correctEl = document.querySelector(`.correct-answer-radio[data-id="${questionId}"]:checked`);

  const options = { A: "", B: "", C: "", D: "" };

  optionEls.forEach(input => {
    options[input.dataset.option] = input.value;
  });

  const payload = {
    question: questionTextEl ? questionTextEl.value.trim() : "",
    options,
    correct: correctEl ? correctEl.value : "A"
  };

  const { error } = await supabaseClient
    .from("tests")
    .update(payload)
    .eq("id", questionId);

  if (error) {
    console.error(error);
    alert("Сұрақ сақталмады");
    return;
  }

  alert("Сұрақ сақталды");
  await loadQuestions();
}

async function deleteQuestion(questionId) {
  if (!confirm("Осы сұрақты өшіргің келе ме?")) return;

  const { error } = await supabaseClient
    .from("tests")
    .delete()
    .eq("id", questionId);

  if (error) {
    console.error(error);
    alert("Сұрақ өшірілмеді");
    return;
  }

  await loadQuestions();
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    return {
      A: options[0] || "",
      B: options[1] || "",
      C: options[2] || "",
      D: options[3] || ""
    };
  }

  if (options && typeof options === "object") {
    return {
      A: options.A || "",
      B: options.B || "",
      C: options.C || "",
      D: options.D || ""
    };
  }

  return {
    A: "",
    B: "",
    C: "",
    D: ""
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

saveLessonBtn.addEventListener("click", saveLesson);
addQuestionBtn.addEventListener("click", addQuestion);

initEditor();