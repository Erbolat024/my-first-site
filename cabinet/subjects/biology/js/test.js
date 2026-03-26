const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    lessonId: params.get("id"),
    sectionId: params.get("section")
  };
}

const form = document.getElementById("test-form");
const submitBtn = document.getElementById("submit-btn");
const resultDiv = document.getElementById("result");
const titleEl = document.getElementById("test-title");

let questions = [];

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function prepareQuestions(data) {
  return data.map((q) => {
    const normalized = normalizeOptions(q.options);

    const optionItems = [
      { key: "A", text: normalized.A },
      { key: "B", text: normalized.B },
      { key: "C", text: normalized.C },
      { key: "D", text: normalized.D }
    ];

    const shuffledOptions = shuffleArray(optionItems);

    return {
      ...q,
      shuffledOptions
    };
  });
}

async function loadTest() {
  const { lessonId } = getParams();

  if (!lessonId) {
    form.innerHTML = "<p>Тест табылмады</p>";
    submitBtn.style.display = "none";
    return;
  }

  try {
    const { data: lesson, error: lessonError } = await supabaseClient
      .from("lessons")
      .select("title")
      .eq("id", lessonId)
      .single();

    if (!lessonError && lesson && titleEl) {
      titleEl.textContent = `${lesson.title} — тест`;
    }

    const { data, error } = await supabaseClient
      .from("tests")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    if (!data || !data.length) {
      form.innerHTML = "<p>Бұл сабаққа тест жоқ</p>";
      submitBtn.style.display = "none";
      return;
    }

    questions = prepareQuestions(shuffleArray(data));
    renderTest();
  } catch (err) {
    console.error(err);
    form.innerHTML = "<p>Қате пайда болды</p>";
    submitBtn.style.display = "none";
  }
}

function renderTest() {
  form.innerHTML = "";
  resultDiv.innerHTML = "";
  form.style.display = "block";
  submitBtn.disabled = true;
  submitBtn.style.display = "inline-block";

  questions.forEach((q, index) => {
    const block = document.createElement("div");
    block.className = "question-block";

    block.innerHTML = `
      <p><b>${index + 1}. ${q.question}</b></p>

      ${q.shuffledOptions.map(option => `
        <label>
          <input type="radio" name="q${index}" value="${option.key}">
          ${option.text}
        </label><br>
      `).join("")}

      <hr>
    `;

    form.appendChild(block);
  });

  form.addEventListener("change", checkAllAnswered);
}

function checkAllAnswered() {
  const answered = questions.every((_, i) => {
    return document.querySelector(`input[name="q${i}"]:checked`);
  });

  submitBtn.disabled = !answered;
}

function getResultStatus(percent) {
  if (percent === 0) {
    return {
      text: "Қайталау керек",
      className: "result-danger"
    };
  }

  if (percent < 80) {
    return {
      text: "Жақсарту керек",
      className: "result-warning"
    };
  }

  return {
    text: "Күшті нәтиже!",
    className: "result-success"
    };
}
/*   jcs */
async function saveResultToSupabase(percent, correctCount, total) {
  const { lessonId } = getParams();

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) throw userError;
    if (!user) return;

    const payload = {
      student_id: user.id,
      subject_name: "Биология",
      lesson_id: String(lessonId),
      score: correctCount,
      total: total,
      percent: percent
    };

    const { error } = await supabaseClient
      .from("student_results")
      .upsert([payload], {
        onConflict: "student_id,lesson_id"
      });

    if (error) throw error;
  } catch (error) {
    console.error("Нәтижені сақтау қатесі:");
    console.error("message:", error?.message);
    console.error("details:", error?.details);
    console.error("hint:", error?.hint);
    console.error("code:", error?.code);
    console.error("full error:", error);
  }
}

async function showResult(correctCount, total) {
  const { sectionId, lessonId } = getParams();
  const percent = Math.round((correctCount / total) * 100);
  const status = getResultStatus(percent);

  await saveResultToSupabase(percent, correctCount, total);

  form.style.display = "none";
  submitBtn.style.display = "none";

  resultDiv.innerHTML = `
    <div class="result-card ${status.className}">
      <h3>Нәтиже: ${percent}%</h3>
      <p class="result-score">${correctCount} / ${total}</p>
      <p class="result-status">${status.text}</p>

      <div class="result-actions">
        <a href="lesson-list.html?section=${sectionId}" class="result-btn secondary-btn">
          ← Сабақтар тізіміне қайту
        </a>
        <a href="test.html?section=${sectionId}&id=${lessonId}" class="result-btn primary-btn">
          Тестті қайта тапсыру
        </a>
      </div>
    </div>
  `;
}

submitBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  let correctCount = 0;

  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && selected.value === q.correct) {
      correctCount++;
    }
  });

  await showResult(correctCount, questions.length);
});

loadTest();