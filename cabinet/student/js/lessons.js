function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    section: params.get("section")
  };
}

function getSubjectTitle(slug) {
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

  return map[slug] || "Пән";
}

function getResultStatus(percent) {
  if (percent === null || percent === undefined) {
    return `
      <div class="lesson-result-badge not-done">
        Тапсырылмады
      </div>
    `;
  }

  let className = "bad";
  let text = `Нәтиже: ${percent}%`;

  if (percent < 40) {
    className = "bad";
    text = `Нашар: ${percent}%`;
  } else if (percent < 60) {
    className = "medium";
    text = `Орташа: ${percent}%`;
  } else if (percent < 80) {
    className = "good";
    text = `Жақсы: ${percent}%`;
  } else {
    className = "excellent";
    text = `Өте жақсы: ${percent}%`;
  }

  return `
    <div class="lesson-result-badge ${className}">
      ${text}
    </div>
  `;
}

async function loadLessons() {
  const grid = document.getElementById("lessons-grid");
  const titleEl = document.getElementById("lessons-title");
  const subtitleEl = document.getElementById("lessons-subtitle");

  if (!grid) return;

  const { subject, section } = getParams();

  if (!subject || !section) {
    grid.innerHTML = `<div class="empty-box">Параметрлер табылмады</div>`;
    return;
  }

  const subjectTitle = getSubjectTitle(subject);

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "/pages/login.html";
    return;
  }

  const { data: sectionData, error: sectionError } = await supabaseClient
    .from("sections")
    .select("id, title")
    .eq("id", section)
    .eq("subject", subject)
    .maybeSingle();

  if (sectionError) {
    console.error("Section loading error:", sectionError);
  }

  if (titleEl) {
    titleEl.textContent = `${subjectTitle} сабақтары`;
  }

  if (subtitleEl) {
    subtitleEl.textContent = sectionData?.title
      ? `Бөлім: ${sectionData.title}`
      : "Таңдалған бөлім бойынша сабақтар тізімі";
  }

  const { data: lessons, error: lessonsError } = await supabaseClient
    .from("lessons")
    .select("id, subject, section_id, title, description, sort_order")
    .eq("subject", subject)
    .eq("section_id", section)
    .order("sort_order", { ascending: true });

  if (lessonsError) {
    console.error("Lessons loading error:", lessonsError);
    grid.innerHTML = `<div class="empty-box">Сабақтарды жүктеу кезінде қате шықты</div>`;
    return;
  }

  if (!lessons || !lessons.length) {
    grid.innerHTML = `<div class="empty-box">Бұл бөлімде әзірге сабақтар жоқ</div>`;
    return;
  }

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: results, error: resultsError } = await supabaseClient
    .from("student_results")
    .select("lesson_id, percent")
    .eq("student_id", user.id)
    .in("lesson_id", lessonIds);

  if (resultsError) {
    console.error("Results loading error:", resultsError);
  }

  const resultMap = {};

  (results || []).forEach((item) => {
    resultMap[item.lesson_id] = item.percent;
  });

  grid.innerHTML = lessons
    .map((lesson, index) => {
      const percent = resultMap[lesson.id];
      const statusHtml = getResultStatus(percent);

      return `
        <div class="subject-card">
          <h3>${index + 1}. ${escapeHtml(lesson.title)}</h3>
          <p>${escapeHtml(lesson.description || "Сабақ сипаттамасы жоқ")}</p>

          ${statusHtml}

          <a href="lesson.html?subject=${encodeURIComponent(lesson.subject)}&section=${lesson.section_id}&lesson=${lesson.id}">
            Ашу
          </a>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", loadLessons);