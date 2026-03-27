async function loadSubjects() {
  const grid = document.getElementById("subjects-grid");
  if (!grid) return;

  grid.innerHTML = `<div class="empty-box">Жүктелуде...</div>`;

  // 1. user аламыз
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "/pages/login.html";
    return;
  }

  // 2. subject_access-тен slug аламыз
  const { data: accessData, error: accessError } = await supabaseClient
    .from("subject_access")
    .select("slug")
    .eq("user_id", user.id);

  if (accessError) {
    console.error("Access error:", accessError);
    grid.innerHTML = `<div class="empty-box">Қате шықты</div>`;
    return;
  }

  if (!accessData || !accessData.length) {
    grid.innerHTML = `<div class="empty-box">Сізге пән әлі ашылмаған</div>`;
    return;
  }

  const slugs = accessData
    .map(item => item.slug)
    .filter(Boolean);

  // 3. subjects table-дан толық инфо аламыз
  const { data: subjects, error: subjectsError } = await supabaseClient
    .from("subjects")
    .select("name, slug, description")
    .in("slug", slugs)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (subjectsError) {
    console.error("Subjects error:", subjectsError);
    grid.innerHTML = `<div class="empty-box">Пәндерді жүктеу мүмкін емес</div>`;
    return;
  }

  // 4. UI шығару
  grid.innerHTML = subjects.map(subject => `
    <div class="subject-card">
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(subject.description || "Пәнге өту")}</p>
      <a href="sections.html?subject=${encodeURIComponent(subject.slug)}">
        Ашу →
      </a>
    </div>
  `).join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", loadSubjects);