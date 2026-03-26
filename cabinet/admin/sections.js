

const subjectSelect = document.getElementById("subjectSelect");
const newSectionTitleInput = document.getElementById("newSectionTitle");
const addSectionBtn = document.getElementById("addSectionBtn");
const sectionsContainer = document.getElementById("sectionsContainer");

let currentSubject = subjectSelect.value;
let sectionsData = [];
let lessonsData = [];

// ===== LOAD =====
async function loadSections() {
  sectionsContainer.innerHTML = `<div class="empty-state">Жүктелуде...</div>`;

  try {
    const { data, error } = await supabaseClient
      .from("sections")
      .select("*")
      .eq("subject", currentSubject)
      .order("id", { ascending: true });

    if (error) throw error;

    sectionsData = data || [];
    await loadLessons();
  } catch (error) {
    console.error("Sections жүктеу қатесі:", error);
    sectionsContainer.innerHTML = `<div class="empty-state">Бөлімдер жүктелмеді.</div>`;
  }
}

async function loadLessons() {
  try {
    if (!sectionsData.length) {
      lessonsData = [];
      renderSections();
      return;
    }

    const ids = sectionsData.map((s) => s.id);

    const { data, error } = await supabaseClient
      .from("lessons")
      .select("*")
      .in("section_id", ids)
      .order("id", { ascending: true });

    if (error) throw error;

    lessonsData = data || [];
    renderSections();
  } catch (error) {
    console.error("Lessons жүктеу қатесі:", error);
    sectionsContainer.innerHTML = `<div class="empty-state">Сабақтар жүктелмеді.</div>`;
  }
}

// ===== HELPERS =====
function getLessons(sectionId) {
  return lessonsData.filter((l) => String(l.section_id) === String(sectionId));
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===== RENDER =====
function renderSections() {
  if (!sectionsContainer) return;

  sectionsContainer.innerHTML = "";

  if (!sectionsData.length) {
    sectionsContainer.innerHTML = `
      <div class="empty-state">Бұл пән бойынша бөлімдер әлі жоқ.</div>
    `;
    return;
  }

  sectionsData.forEach((section) => {
    const lessons = getLessons(section.id);

    const div = document.createElement("div");
    div.className = "section-card";

    div.innerHTML = `
      <div class="section-top">
        <input
          class="section-title-input"
          data-id="${section.id}"
          value="${escapeHtml(section.title)}"
        />
        <div class="section-actions">
          <button type="button" onclick="saveSection(${section.id})">Сақтау</button>
          <button type="button" onclick="deleteSection(${section.id})">Өшіру</button>
        </div>
      </div>

      <div class="add-lesson-row">
        <input type="text" placeholder="Сабақ атауы" id="lesson-${section.id}" />
        <button type="button" onclick="addLesson(${section.id})">+ Сабақ</button>
      </div>

      <div class="lessons-list">
        ${
          lessons.length
            ? lessons.map((l) => `
              <div class="lesson-item">
                <input value="${escapeHtml(l.title)}" id="lesson-title-${l.id}" />
                <div class="lesson-actions">
                  <button type="button" onclick="saveLesson(${l.id})">💾</button>
                  <button type="button" onclick="openLesson(${section.id}, ${l.id})">✏️</button>
                  <button type="button" onclick="deleteLesson(${l.id})">❌</button>
                </div>
              </div>
            `).join("")
            : `<div class="empty-lessons">Бұл бөлімде сабақ жоқ.</div>`
        }
      </div>
    `;

    sectionsContainer.appendChild(div);
  });
}

// ===== SECTION =====
async function addSection() {
  const title = newSectionTitleInput.value.trim();
  if (!title) return;

  try {
    const { error } = await supabaseClient
      .from("sections")
      .insert([{ subject: currentSubject, title }]);

    if (error) throw error;

    newSectionTitleInput.value = "";
    await loadSections();
  } catch (error) {
    console.error("Бөлім қосу қатесі:", error);
    alert("Бөлім қосылмады");
  }
}

async function saveSection(id) {
  const input = document.querySelector(`.section-title-input[data-id="${id}"]`);
  if (!input) return;

  try {
    const { error } = await supabaseClient
      .from("sections")
      .update({ title: input.value.trim() })
      .eq("id", id);

    if (error) throw error;

    alert("Сақталды");
  } catch (error) {
    console.error("Бөлім сақтау қатесі:", error);
    alert("Сақталмады");
  }
}

async function deleteSection(id) {
  if (!confirm("Бөлімді өшіру керек пе?")) return;

  try {
    const { error: lessonsError } = await supabaseClient
      .from("lessons")
      .delete()
      .eq("section_id", id);

    if (lessonsError) throw lessonsError;

    const { error } = await supabaseClient
      .from("sections")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadSections();
  } catch (error) {
    console.error("Бөлім өшіру қатесі:", error);
    alert("Өшірілмеді");
  }
}

// ===== LESSON =====
async function addLesson(sectionId) {
  const input = document.getElementById(`lesson-${sectionId}`);
  if (!input) return;

  const title = input.value.trim();
  if (!title) return;

  try {
    const { error } = await supabaseClient
      .from("lessons")
      .insert([
        {
          section_id: sectionId,
          subject: currentSubject,
          title
        }
      ]);

    if (error) throw error;

    input.value = "";
    await loadSections();
  } catch (error) {
    console.error("Сабақ қосу қатесі:", error);
    alert("Сабақ қосылмады");
  }
}

async function saveLesson(id) {
  const input = document.getElementById(`lesson-title-${id}`);
  if (!input) return;

  try {
    const { error } = await supabaseClient
      .from("lessons")
      .update({ title: input.value.trim() })
      .eq("id", id);

    if (error) throw error;

    alert("Сақталды");
  } catch (error) {
    console.error("Сабақ сақтау қатесі:", error);
    alert("Сақталмады");
  }
}

async function deleteLesson(id) {
  if (!confirm("Сабақты өшіру керек пе?")) return;

  try {
    const { error } = await supabaseClient
      .from("lessons")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadSections();
  } catch (error) {
    console.error("Сабақ өшіру қатесі:", error);
    alert("Өшірілмеді");
  }
}

function openLesson(sectionId, lessonId) {
  window.location.href = `lesson-editor.html?subject=${currentSubject}&section=${sectionId}&id=${lessonId}`;
}

// ===== INIT =====
subjectSelect.addEventListener("change", async () => {
  currentSubject = subjectSelect.value;
  await loadSections();
});

addSectionBtn.addEventListener("click", addSection);

window.saveSection = saveSection;
window.deleteSection = deleteSection;
window.addLesson = addLesson;
window.saveLesson = saveLesson;
window.deleteLesson = deleteLesson;
window.openLesson = openLesson;

loadSections();