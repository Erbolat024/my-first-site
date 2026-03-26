let allStudents = [];
let selectedStudentId = null;
let selectedStudentName = "";

const SUBJECTS = [
  "Биология",
  "Химия",
  "Ағылшын",
  "Оқу сауаттылығы",
  "Математикалық сауаттылық"
];

async function loadStudents() {
  const list = document.getElementById("students-list");
  if (!list) return;

  list.innerHTML = `<div class="student-item">Жүктелуде...</div>`;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, email, role")
    .eq("role", "student")
    .order("name", { ascending: true });

  if (error) {
    console.error("Students loading error:", error);
    list.innerHTML = `<div class="student-item">Қате шықты</div>`;
    return;
  }

  allStudents = data || [];
  renderStudents(allStudents);
}

function renderStudents(students) {
  const list = document.getElementById("students-list");
  if (!list) return;

  if (!students.length) {
    list.innerHTML = `<div class="student-item">Оқушылар табылмады</div>`;
    return;
  }

  list.innerHTML = students
    .map(
      (student) => `
        <button
          type="button"
          class="student-item ${selectedStudentId === student.id ? "active" : ""}"
          onclick="selectStudent('${student.id}', '${escapeHtml(student.name || "")}', '${escapeHtml(student.email || "")}')"
        >
          <strong>${escapeHtml(student.name || "-")}</strong>
          <span>${escapeHtml(student.email || "-")}</span>
        </button>
      `
    )
    .join("");
}

async function selectStudent(studentId, studentName, studentEmail) {
  selectedStudentId = studentId;
  selectedStudentName = studentName;

  renderStudents(allStudents);

  const info = document.getElementById("selected-student-info");
  const subjectsBox = document.getElementById("subjects-box");

  if (info) {
    info.innerHTML = `
      <strong>Таңдалған оқушы:</strong><br>
      ${studentName}<br>
      <span>${studentEmail}</span>
    `;
  }

  if (subjectsBox) {
    subjectsBox.classList.remove("hidden");
  }

  await loadStudentSubjects(studentId);
}

async function loadStudentSubjects(studentId) {
  const { data, error } = await supabaseClient
    .from("subject_access")
    .select("subject_name")
    .eq("user_id", studentId);

  if (error) {
    console.error("Subject access loading error:", error);
    return;
  }

  const grantedSubjects = (data || []).map((item) => item.subject_name);

  const checkboxes = document.querySelectorAll('#subjects-box input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = grantedSubjects.includes(checkbox.value);
  });
}

async function saveAccess() {
  if (!selectedStudentId) {
    alert("Алдымен оқушыны таңда");
    return;
  }

  const checkedSubjects = Array.from(
    document.querySelectorAll('#subjects-box input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  const { error: deleteError } = await supabaseClient
    .from("subject_access")
    .delete()
    .eq("user_id", selectedStudentId);

  if (deleteError) {
    console.error("Delete access error:", deleteError);
    alert("Ескі доступты өшіру кезінде қате шықты");
    return;
  }

  if (checkedSubjects.length > 0) {
    const rowsToInsert = checkedSubjects.map((subject) => ({
      user_id: selectedStudentId,
      subject_name: subject
    }));

    const { error: insertError } = await supabaseClient
      .from("subject_access")
      .insert(rowsToInsert);

    if (insertError) {
      console.error("Insert access error:", insertError);
      alert("Жаңа доступты сақтау кезінде қате шықты");
      return;
    }
  }

  alert(`Пән доступы сақталды ✅\n${selectedStudentName}`);
}

function setupStudentSearch() {
  const input = document.getElementById("student-search");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const value = e.target.value.trim().toLowerCase();

    const filtered = allStudents.filter((student) => {
      const name = (student.name || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      return name.includes(value) || email.includes(value);
    });

    renderStudents(filtered);
  });
}

function setupSaveButton() {
  const saveBtn = document.getElementById("save-access-btn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", saveAccess);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  setupStudentSearch();
  setupSaveButton();
  loadStudents();
});