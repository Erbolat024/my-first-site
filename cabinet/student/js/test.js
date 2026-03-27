let currentQuestions = [];
let currentLesson = null;

function getLessonIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("lesson");
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseOptions(optionsValue) {
  if (!optionsValue) return [];

  let parsed = optionsValue;

  if (typeof optionsValue === "string") {
    try {
      parsed = JSON.parse(optionsValue);
    } catch (error) {
      console.error("Options parse error:", error);
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (typeof item === "string") {
        return { key: item, text: item };
      }

      return {
        key: item.key || item.label || "",
        text: item.text || item.value || ""
      };
    });
  }

  if (typeof parsed === "object") {
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      text: String(value)
    }));
  }

  return [];
}

function getResultMessage(percent) {
  if (percent < 40) {
    return "Нашар нәтиже. Материалды қайта қарап шық.";
  }

  if (percent < 60) {
    return "Әлі де оқу керек. Тағы бір рет қайталап шық.";
  }

  if (percent < 80) {
    return "Жақсы нәтиже, бірақ қайталау керек.";
  }

  return "Өте күшті нәтиже!";
}

function getSubjectDisplayName(subjectSlug) {
  const map = {
    biology: "Биология",
    chemistry: "Химия",
    english: "Ағылшын",
    reading: "Оқу сауаттылығы",
    math: "Математикалық сауаттылық",
    kazakh: "Қазақ тілі",
    physics: "Физика",
    geography: "География"
  };

  return map[subjectSlug] || subjectSlug || "Пән";
}

async function loadTest() {
  const lessonId = getLessonIdFromUrl();
  const questionsContainer = document.getElementById("questions-container");
  const testTitle = document.getElementById("test-title");
  const testSubtitle = document.getElementById("test-subtitle");

  if (!lessonId) {
    questionsContainer.innerHTML = `<div class="empty-box">Lesson ID табылмады</div>`;
    return;
  }

  const { data: lessonData, error: lessonError } = await supabaseClient
    .from("lessons")
    .select("id, title, subject, section_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lessonData) {
    console.error("Lesson loading error:", lessonError);
    questionsContainer.innerHTML = `<div class="empty-box">Сабақ табылмады</div>`;
    return;
  }

  currentLesson = lessonData;

  if (testTitle) {
    testTitle.textContent = `${lessonData.title} — тест`;
  }

  if (testSubtitle) {
    testSubtitle.textContent = "Дұрыс жауапты таңдаңыз";
  }

  const { data, error } = await supabaseClient
    .from("tests")
    .select("id, lesson_id, question, options, correct, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Tests loading error:", error);
    questionsContainer.innerHTML = `<div class="empty-box">Тест сұрақтарын жүктеу кезінде қате шықты</div>`;
    return;
  }

  if (!data || !data.length) {
    questionsContainer.innerHTML = `<div class="empty-box">Бұл сабаққа әлі тест қосылмаған</div>`;
    return;
  }

  const randomizedQuestions = shuffle(data).map((question) => {
    const parsedOptions = parseOptions(question.options);
    const shuffledOptions = shuffle(parsedOptions);

    return {
      ...question,
      parsedOptions: shuffledOptions
    };
  });

  currentQuestions = randomizedQuestions;

  questionsContainer.innerHTML = randomizedQuestions
    .map((item, index) => {
      const optionsHtml = item.parsedOptions
        .map((option) => `
          <label class="option-label">
            <input
              type="radio"
              name="question-${item.id}"
              value="${escapeHtml(option.key)}"
            />
            <span><strong>${escapeHtml(option.key)}.</strong> ${escapeHtml(option.text)}</span>
          </label>
        `)
        .join("");

      return `
        <div class="question-card">
          <div class="question-title">${index + 1}. ${escapeHtml(item.question)}</div>
          <div class="options-list">
            ${optionsHtml}
          </div>
        </div>
      `;
    })
    .join("");
}

async function saveResult(score, total, percent) {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user || !currentLesson) {
    console.error("User not found or lesson missing");
    return;
  }

  const row = {
    student_id: user.id,
    subject_name: getSubjectDisplayName(currentLesson.subject),
    lesson_id: currentLesson.id,
    score,
    total,
    percent
  };

  const { error: upsertError } = await supabaseClient
  .from("student_results")
  .upsert(row, {
    onConflict: "student_id,lesson_id"
  });

if (upsertError) {
  console.error("Result upsert error:", upsertError);
  alert(`Нәтижені сақтау кезінде қате шықты:\n${upsertError.message}`);
}
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!currentQuestions.length) return;

  let score = 0;

  currentQuestions.forEach((question) => {
    const checked = document.querySelector(`input[name="question-${question.id}"]:checked`);
    if (checked && checked.value === question.correct) {
      score++;
    }
  });

  const total = currentQuestions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const message = getResultMessage(percent);

  await saveResult(score, total, percent);

  const form = document.getElementById("test-form");
  const resultBox = document.getElementById("result-box");

  if (form) {
    form.classList.add("hidden");
  }

  if (resultBox) {
    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `
      <div class="final-result-card">
        <h2>Тест аяқталды ✅</h2>
        <p><strong>Дұрыс жауаптар:</strong> ${score} / ${total}</p>
        <p><strong>Нәтиже:</strong> ${percent}%</p>
        <p class="result-message">${escapeHtml(message)}</p>

        <div class="result-actions">
          <a href="lessons.html?subject=${encodeURIComponent(currentLesson.subject)}&section=${encodeURIComponent(currentLesson.section_id)}" class="result-btn secondary-btn">
            Сабақтар тізіміне қайту
          </a>

          <button type="button" class="result-btn primary-btn" id="retry-btn">
            Қайта тапсыру
          </button>
        </div>
      </div>
    `;

    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        window.location.reload();
      });
    }

    resultBox.scrollIntoView({ behavior: "smooth" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadTest();

  const form = document.getElementById("test-form");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
});