function getSubjectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subject");
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

async function loadSections() {
  const grid = document.getElementById("sections-grid");
  const titleEl = document.getElementById("sections-title");
  const subtitleEl = document.getElementById("sections-subtitle");

  if (!grid) return;

  const subjectSlug = getSubjectFromUrl();

  if (!subjectSlug) {
    grid.innerHTML = `<div class="empty-box">Пән параметрі табылмады</div>`;
    return;
  }

  const subjectTitle = getSubjectTitle(subjectSlug);

  if (titleEl) {
    titleEl.textContent = `${subjectTitle} бөлімдері`;
  }

  if (subtitleEl) {
    subtitleEl.textContent = "Таңдалған пән бойынша бөлімдер тізімі";
  }

  const { data, error } = await supabaseClient
    .from("sections")
    .select("id, subject, title, sort_order")
    .eq("subject", subjectSlug)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Sections loading error:", error);
    grid.innerHTML = `<div class="empty-box">Бөлімдерді жүктеу кезінде қате шықты</div>`;
    return;
  }

  if (!data || !data.length) {
    grid.innerHTML = `<div class="empty-box">Бұл пәнде әзірге бөлімдер жоқ</div>`;
    return;
  }

  grid.innerHTML = data
    .map(
      (section, index) => `
        <div class="subject-card">
          <h3>${index + 1}. ${escapeHtml(section.title)}</h3>
          <p>${subjectTitle} пәнінің бөлімі</p>
          <a href="lessons.html?subject=${encodeURIComponent(section.subject)}&section=${section.id}">
            Ашу
          </a>
        </div>
      `
    )
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

document.addEventListener("DOMContentLoaded", loadSections);