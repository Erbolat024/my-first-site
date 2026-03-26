const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

function getLessonId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "1";
}

function getSectionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "1";
}

const lessonId = getLessonId();
const sectionId = getSectionId();

let originalQuestions = [];
let renderedQuestions = [];
let isSubmitting = false;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadTest() {
  try {
    const response = await fetch("../data/tests.json");

    if (!response.ok) {
      throw new Error("tests.json жүктелмеді");
    }

    const data = await response.json();
    const questions = data[lessonId];

    const title = document.getElementById("test-title");
    const form = document.getElementById("test-form");

    if (!questions || !questions.length) {
      if (title) title.textContent = "Тест табылмады";
      if (form) form.innerHTML = "<p>Бұл сабаққа тест әлі қосылмаған.</p>";
      return;
    }

    originalQuestions = questions;

    renderedQuestions = shuffle(
      questions.map((q) => {
        const correctAnswer = q.options[q.correct];
        const shuffledOptions = shuffle(q.options);

        return {
          question: q.question,
          options: shuffledOptions,
          correctAnswer: correctAnswer
        };
      })
    );

    renderTest();
  } catch (error) {
    const title = document.getElementById("test-title");
    const form = document.getElementById("test-form");

    if (title) title.textContent = "Қате";
    if (form) form.innerHTML = `<p>${error.message}</p>`;
  }
}

function renderTest() {
  const form = document.getElementById("test-form");
  const submitBtn = document.getElementById("submit-btn");
  const resultDiv = document.getElementById("result");

  if (!form || !submitBtn || !resultDiv) return;

  form.innerHTML = "";
  resultDiv.innerHTML = "";
  submitBtn.disabled = true;
  submitBtn.style.display = "inline-block";
  isSubmitting = false;

  renderedQuestions.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.className = "question";

    let optionsHtml = "";

    q.options.forEach((option) => {
      const safeOption = escapeHtml(option);

      optionsHtml += `
        <label class="option">
          <input type="radio" name="q${index}" value="${safeOption}">
          <span>${safeOption}</span>
        </label>
      `;
    });

    qDiv.innerHTML = `
      <p><strong>${index + 1}. ${escapeHtml(q.question)}</strong></p>
      <div class="options">${optionsHtml}</div>
    `;

    form.appendChild(qDiv);
  });
}

function checkAllAnswered() {
  const total = renderedQuestions.length;
  const answered = document.querySelectorAll('#test-form input[type="radio"]:checked').length;
  const submitBtn = document.getElementById("submit-btn");

  if (submitBtn) {
    submitBtn.disabled = answered !== total;
  }
}

function saveResultLocal(percent) {
  localStorage.setItem(`math_lesson_${lessonId}_result`, String(percent));
}

async function saveResultSupabase(percent, score, totalQuestions) {
  if (!supabaseClient) return;

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.warn("Пайдаланушы табылмады");
      return;
    }

    const payload = {
      student_id: user.id,
      subject_name: "math",
      lesson_id: lessonId,
      score: score,
      total: totalQuestions,
      percent: percent
    };

    const { error } = await supabaseClient
      .from("student_results")
      .upsert([payload], {
        onConflict: "student_id,subject_name,lesson_id"
      });

    if (error) {
      console.error("Supabase save error:", error.message);
    }
  } catch (err) {
    console.error("Supabase save exception:", err);
  }
}

async function finishTest() {
  if (isSubmitting) return;
  isSubmitting = true;

  let score = 0;

  renderedQuestions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && selected.value === q.correctAnswer) {
      score++;
    }
  });

  const totalQuestions = renderedQuestions.length;
  const percent = Math.round((score / totalQuestions) * 100);

  saveResultLocal(percent);
  await saveResultSupabase(percent, score, totalQuestions);

  const resultDiv = document.getElementById("result");
  const submitBtn = document.getElementById("submit-btn");

  if (!resultDiv || !submitBtn) return;

  let message = `${score}/${totalQuestions} (${percent}%) `;

  if (percent === 0) {
    message += "❌ Сабақты қайта оқу керек";
    resultDiv.style.color = "red";
  } else if (percent < 80) {
    message += "⚠️ Қайталау керек";
    resultDiv.style.color = "orange";
  } else {
    message += "✅ Тесттен өтті";
    resultDiv.style.color = "green";
  }

  resultDiv.innerHTML = `
    <p>${message}</p>
    <div class="result-actions">
      <a href="lesson-list.html?section=${sectionId}" class="result-btn">Сабақтар тізіміне қайту</a>
      <button type="button" class="result-btn" id="retry-btn">Қайта тест тапсыру</button>
    </div>
  `;

  submitBtn.style.display = "none";

  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", restartTest);
  }
}

function restartTest() {
  renderedQuestions = shuffle(
    originalQuestions.map((q) => {
      const correctAnswer = q.options[q.correct];
      const shuffledOptions = shuffle(q.options);

      return {
        question: q.question,
        options: shuffledOptions,
        correctAnswer: correctAnswer
      };
    })
  );

  renderTest();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("change", (event) => {
  if (event.target.matches('#test-form input[type="radio"]')) {
    checkAllAnswered();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", finishTest);
  }

  loadTest();
});