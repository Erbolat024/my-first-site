const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

function getResultMeta(percent) {
  if (percent === null || percent === undefined) {
    return {
      text: "Тапсырылмады",
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

async function loadLessonList() {
  const sectionId = getSectionId();

  const titleEl = document.getElementById("section-title");
  const descEl = document.getElementById("section-description");
  const listEl = document.getElementById("lesson-list");

  if (!listEl) {
    console.error("lesson-list id табылмады");
    return;
  }

  if (!sectionId) {
    showError("Бөлім ID табылмады");
    return;
  }

  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) throw userError;

    const { data: section, error: sectionError } = await supabaseClient
      .from("sections")
      .select("*")
      .eq("id", sectionId)
      .single();

    if (sectionError) throw sectionError;

    const { data: lessons, error: lessonsError } = await supabaseClient
      .from("lessons")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });

    if (lessonsError) throw lessonsError;

    if (titleEl) titleEl.textContent = section.title || "Сабақтар тізімі";
    if (descEl) descEl.textContent = "Осы бөлім бойынша сабақтар тізімі";

    listEl.innerHTML = "";

    if (!lessons || lessons.length === 0) {
      listEl.innerHTML = `
        <div class="lesson-list-empty">Бұл бөлімде сабақтар әлі жоқ.</div>
      `;
      return;
    }

    let resultsMap = {};

if (user) {
  const lessonIds = lessons.map(lesson => String(lesson.id));

  const { data: results, error: resultsError } = await supabaseClient
    .from("student_results")
    .select("*")
    .eq("student_id", user.id)
    .in("lesson_id", lessonIds);

  if (resultsError) {
    console.error("student_results қатесі:", resultsError);
  } else {
    resultsMap = (results || []).reduce((acc, item) => {
      acc[String(item.lesson_id)] = item;
      return acc;
    }, {});
  }
}

    lessons.forEach((lesson, index) => {
      const resultItem = resultsMap[String(lesson.id)];
      const percent = resultItem ? Number(resultItem.percent) : null;
      const resultMeta = getResultMeta(percent);

      const card = document.createElement("div");
      card.className = "lesson-list-item";

      card.innerHTML = `
        <div class="lesson-list-left">
          <div class="lesson-number">${index + 1}</div>

          <div class="lesson-info">
            <h3>${lesson.title}</h3>
            <p>${lesson.description || "Сипаттама әлі енгізілмеген."}</p>

            <div class="lesson-result ${resultMeta.className}">
              ${resultMeta.text}
            </div>
          </div>
        </div>

        <div class="lesson-list-right">
          <a href="lesson.html?section=${sectionId}&id=${lesson.id}" class="open-btn">
            Сабақты ашу
          </a>
          <a href="test.html?section=${sectionId}&id=${lesson.id}" class="open-btn secondary">
            Тест тапсыру
          </a>
        </div>
      `;

      listEl.appendChild(card);
    });
  } catch (error) {
    console.error("Lesson list қатесі:", error);
    showError(error.message || "Сабақтар жүктелмеді");
  }
}

function showError(message) {
  const titleEl = document.getElementById("section-title");
  const descEl = document.getElementById("section-description");
  const listEl = document.getElementById("lesson-list");

  if (titleEl) titleEl.textContent = "Қате";
  if (descEl) descEl.textContent = "";
  if (listEl) {
    listEl.innerHTML = `<div class="lesson-list-empty">${message}</div>`;
  }
}

loadLessonList();