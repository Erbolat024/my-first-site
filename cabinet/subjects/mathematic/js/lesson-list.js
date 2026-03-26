const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

function getSectionId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section");
}

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
  });
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getSupabaseResultsMap() {
  const resultsMap = {};

  if (!supabaseClient) {
    return resultsMap;
  }

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.warn("Пайдаланушы табылмады, тек localStorage қолданылады");
      return resultsMap;
    }

    const { data, error } = await supabaseClient
      .from("student_results")
      .select("lesson_id, percent, subject_name, student_id")
      .eq("student_id", user.id)
      .eq("subject_name", "math");

    if (error) {
      console.error("Supabase results оқу қатесі:", error.message);
      return resultsMap;
    }

    (data || []).forEach((item) => {
      resultsMap[String(item.lesson_id)] = Number(item.percent) || 0;
    });

    return resultsMap;
  } catch (err) {
    console.error("Supabase results exception:", err);
    return resultsMap;
  }
}

function getLocalResult(lessonId) {
  const value = localStorage.getItem(`math_lesson_${lessonId}_result`);
  if (value === null) return null;

  const percent = Number(value);
  return Number.isNaN(percent) ? null : percent;
}

function getMergedPercent(lessonId, supabaseResultsMap) {
  const localPercent = getLocalResult(lessonId);
  const supabasePercent = Object.prototype.hasOwnProperty.call(supabaseResultsMap, String(lessonId))
    ? Number(supabaseResultsMap[String(lessonId)])
    : null;

  if (localPercent === null && supabasePercent === null) {
    return null;
  }

  if (localPercent === null) {
    return supabasePercent;
  }

  if (supabasePercent === null) {
    return localPercent;
  }

  return Math.max(localPercent, supabasePercent);
}

function getLessonStatus(lessonId, supabaseResultsMap) {
  const percent = getMergedPercent(lessonId, supabaseResultsMap);

  if (percent === null) {
    return {
      text: "Тест тапсырылмаған",
      color: "gray"
    };
  }

  if (percent === 0) {
    return {
      text: "Сабақты қайта оқу керек (0%)",
      color: "red"
    };
  }

  if (percent < 80) {
    return {
      text: `Қайталау керек (${percent}%)`,
      color: "orange"
    };
  }

  return {
    text: `Тесттен өтті (${percent}%)`,
    color: "green"
  };
}

async function loadLessonList() {
  const sectionId = getSectionId();

  if (!sectionId) {
    showError("Бөлім ID табылмады");
    return;
  }

  try {
    const [sectionsResponse, lessonsResponse, supabaseResultsMap] = await Promise.all([
      fetch("../data/sections.json"),
      fetch("../data/lessons.json"),
      getSupabaseResultsMap()
    ]);

    if (!sectionsResponse.ok) {
      throw new Error(`sections.json табылмады: ${sectionsResponse.status}`);
    }

    if (!lessonsResponse.ok) {
      throw new Error(`lessons.json табылмады: ${lessonsResponse.status}`);
    }

    const sections = await sectionsResponse.json();
    const lessons = await lessonsResponse.json();

    const section = sections.find((item) => String(item.id) === String(sectionId));
    const filteredLessons = lessons.filter((item) => String(item.sectionId) === String(sectionId));

    if (!section) {
      showError("Бөлім табылмады");
      return;
    }

    renderSection(section);
    renderLessonList(filteredLessons, sectionId, supabaseResultsMap);
  } catch (error) {
    console.error("Сабақтар тізімін жүктеу қатесі:", error);
    showError("Сабақтар жүктелмеді");
  }
}

function renderSection(section) {
  document.title = section.title;

  const titleEl = document.getElementById("section-title");
  const descEl = document.getElementById("section-description");

  if (titleEl) titleEl.textContent = section.title;
  if (descEl) descEl.textContent = section.description || "";
}

function renderLessonList(lessons, sectionId, supabaseResultsMap) {
  const lessonList = document.getElementById("lesson-list");

  if (!lessonList) return;

  if (!lessons.length) {
    lessonList.innerHTML = `
      <div class="lesson-list-empty">
        Бұл бөлімге сабақтар әлі қосылмаған.
      </div>
    `;
    return;
  }

  lessonList.innerHTML = "";

  lessons.forEach((lesson, index) => {
    const status = getLessonStatus(lesson.id, supabaseResultsMap);

    const card = document.createElement("div");
    card.className = "lesson-list-item";

    card.innerHTML = `
      <div class="lesson-list-left">
        <div class="lesson-number">${index + 1}</div>

        <div class="lesson-info">
          <h3>${escapeHtml(lesson.title)}</h3>
          <p>${escapeHtml(lesson.description || "")}</p>

          <p class="lesson-status" style="color:${status.color}; font-weight:600; margin:10px 0 0;">
            ${escapeHtml(status.text)}
          </p>

          <div class="lesson-item-actions">
            <a href="lesson.html?id=${encodeURIComponent(lesson.id)}&section=${encodeURIComponent(sectionId)}" class="open-btn">Ашу</a>
          </div>
        </div>
      </div>
    `;

    lessonList.appendChild(card);
  });
}

function showError(message) {
  document.title = "Қате";

  const titleEl = document.getElementById("section-title");
  const descEl = document.getElementById("section-description");
  const lessonList = document.getElementById("lesson-list");

  if (titleEl) titleEl.textContent = message;
  if (descEl) descEl.textContent = "";
  if (lessonList) {
    lessonList.innerHTML = `
      <div class="lesson-list-empty">
        Қайта тексеріп көр.
      </div>
    `;
  }
}

loadLessonList();