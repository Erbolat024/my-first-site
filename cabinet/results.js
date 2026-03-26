const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
  });
}

function getResultMeta(percent) {
  if (percent === null || percent === undefined || Number.isNaN(percent)) {
    return {
      text: "Тест тапсырылмады",
      className: "result-not-started"
    };
  }

  if (percent === 0) {
    return {
      text: "Қайталау керек",
      className: "result-danger"
    };
  }

  if (percent < 80) {
    return {
      text: `Нәтиже: ${percent}%`,
      className: "result-warning"
    };
  }

  return {
    text: `Нәтиже: ${percent}%`,
    className: "result-success"
  };
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getPercent(item) {
  if (!item) return null;

  const percent = Number(item.percent);
  if (!Number.isNaN(percent)) return percent;

  const score = Number(item.score);
  const total = Number(item.total);

  if (!Number.isNaN(score) && !Number.isNaN(total) && total > 0) {
    return Math.round((score / total) * 100);
  }

  return null;
}

function getLatestResultsByLesson(results) {
  const map = {};

  (results || []).forEach((item) => {
    const lessonId = String(item.lesson_id);
    const existing = map[lessonId];

    if (!existing) {
      map[lessonId] = item;
      return;
    }

    const currentTime = new Date(item.created_at || 0).getTime();
    const existingTime = new Date(existing.created_at || 0).getTime();

    if (currentTime > existingTime) {
      map[lessonId] = item;
    }
  });

  return Object.values(map).sort((a, b) => {
    return (Number(a.lesson_id) || 0) - (Number(b.lesson_id) || 0);
  });
}

function fillSummary(subjectCount, completedCount, averagePercent, lastResultText) {
  const subjectCountEl = document.getElementById("summary-subject-count");
  const testCountEl = document.getElementById("summary-test-count");
  const averageEl = document.getElementById("summary-average");
  const lastResultEl = document.getElementById("summary-last-result");
  const resultsMessage = document.getElementById("results-message");

  if (subjectCountEl) subjectCountEl.textContent = subjectCount;
  if (testCountEl) testCountEl.textContent = completedCount;
  if (averageEl) averageEl.textContent = `${averagePercent}%`;
  if (lastResultEl) lastResultEl.textContent = lastResultText;

  if (resultsMessage) {
    resultsMessage.textContent = subjectCount
      ? "Пәндер бойынша нәтижелер жүктелді."
      : "Нәтижелер табылмады.";
  }
}

function showEmpty(message) {
  const resultsGrid = document.getElementById("results-grid");
  if (!resultsGrid) return;

  resultsGrid.innerHTML = `
    <div class="results-empty">${message}</div>
  `;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("kk-KZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function loadResultsPage() {
  const resultsGrid = document.getElementById("results-grid");
  const detailsBlock = document.getElementById("subject-results-details");
  const logoutBtn = document.getElementById("logout-btn");

  if (!resultsGrid) return;

  if (detailsBlock) {
    detailsBlock.classList.add("hidden");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "../index.html";
    });
  }

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      window.location.href = "../index.html";
      return;
    }

    const { data: accessRows, error: accessError } = await supabaseClient
      .from("subject_access")
      .select("subject_name")
      .eq("user_id", user.id);

    if (accessError) throw accessError;

    const subjectNames = [...new Set(
      (accessRows || []).map((item) => item.subject_name).filter(Boolean)
    )];

    if (!subjectNames.length) {
      fillSummary(0, 0, 0, "—");
      showEmpty("Саған әлі пәндер берілмеген.");
      return;
    }

    const { data: allResults, error: resultsError } = await supabaseClient
      .from("student_results")
      .select("*")
      .eq("student_id", user.id)
      .in("subject_name", subjectNames)
      .order("created_at", { ascending: false });

    if (resultsError) throw resultsError;

    resultsGrid.innerHTML = "";

    let totalCompleted = 0;
    let totalPercentSum = 0;
    let lastResultText = "—";

    if (allResults && allResults.length) {
      const latestGlobal = [...allResults].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      })[0];

      const latestGlobalPercent = getPercent(latestGlobal);
      lastResultText = latestGlobalPercent !== null ? `${latestGlobalPercent}%` : "—";
    }

    for (const subjectName of subjectNames) {
      const subjectAllResults = (allResults || []).filter(
        (item) => normalizeText(item.subject_name) === normalizeText(subjectName)
      );

      const latestLessons = getLatestResultsByLesson(subjectAllResults);

      let subjectCompleted = 0;
      let subjectPercentSum = 0;

      const lessonCardsHtml = latestLessons.map((item, index) => {
        const percent = getPercent(item);
        const resultMeta = getResultMeta(percent);

        if (percent !== null && !Number.isNaN(percent)) {
          subjectCompleted++;
          subjectPercentSum += percent;
          totalCompleted++;
          totalPercentSum += percent;
        }

        return `
          <div class="lesson-list-item">
            <div class="lesson-list-left">
              <div class="lesson-number">${item.lesson_id}</div>

              <div class="lesson-info">
                <h3>Сабақ ${item.lesson_id}</h3>
                <p>Соңғы тапсыру: ${formatDate(item.created_at)}</p>

                <div class="lesson-result ${resultMeta.className}">
                  ${resultMeta.text}
                </div>
              </div>
            </div>

            <div class="lesson-list-right">
              <span class="open-btn secondary" style="pointer-events:none; opacity:.85;">
                Рейтинг
              </span>
            </div>
          </div>
        `;
      }).join("");

      const subjectAverage = subjectCompleted > 0
        ? Math.round(subjectPercentSum / subjectCompleted)
        : 0;

      const subjectBlock = document.createElement("section");
      subjectBlock.className = "subject-results-block";

      subjectBlock.innerHTML = `
        <div class="subject-results-header">
          <h2>${subjectName}</h2>
          <p>Жалпы рейтинг: ${subjectAverage}% · Тапсырылғаны: ${subjectCompleted}/${latestLessons.length}</p>
        </div>

        <div class="subject-lessons-list">
          ${
            latestLessons.length
              ? lessonCardsHtml
              : `<div class="results-empty">Бұл пән бойынша әлі нәтиже жоқ.</div>`
          }
        </div>
      `;

      resultsGrid.appendChild(subjectBlock);
    }

    const overallAverage = totalCompleted > 0
      ? Math.round(totalPercentSum / totalCompleted)
      : 0;

    fillSummary(
      subjectNames.length,
      totalCompleted,
      overallAverage,
      lastResultText
    );

    if (!resultsGrid.innerHTML.trim()) {
      showEmpty("Нәтижелер табылмады.");
    }
  } catch (error) {
    console.error("Results page error:", error);
    fillSummary(0, 0, 0, "—");
    showEmpty("Қате шықты. Нәтижелер жүктелмеді.");
  }
}

loadResultsPage();