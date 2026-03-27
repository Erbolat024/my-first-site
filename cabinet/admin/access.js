let allStudents = [];
let allSubjects = [];
let selectedStudentId = null;
let selectedStudentName = "";

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

async function loadSubjects() {
  const subjectsList = document.getElementById("subjects-list");
  if (!subjectsList) return;

  subjectsList.innerHTML = `<div class="subject-check">Жүктелуде...</div>`;

  const { data, error } = await supabaseClient
    .from("subjects")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Subjects loading error:", error);
    subjectsList.innerHTML = `<div class="subject-check">Пәндерді жүктеу кезінде қате шықты</div>`;
    return;
  }

  allSubjects = data || [];
  renderSubjects(allSubjects);
}

function renderSubjects(subjects) {
  const subjectsList = document.getElementById("subjects-list");
  if (!subjectsList) return;

  if (!subjects.length) {
    subjectsList.innerHTML = `<div class="subject-check">Пәндер табылмады</div>`;
    return;
  }

  subjectsList.innerHTML = subjects
    .map(
      (subject) => `
        <label class="subject-check">
          <input
            type="checkbox"
            value="${escapeHtml(subject.slug || "")}"
            data-subject-name="${escapeHtml(subject.name || "")}"
            data-subject-slug="${escapeHtml(subject.slug || "")}"
          />
          <span>${escapeHtml(subject.name || "-")}</span>
        </label>
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
    .select("subject_name, slug")
    .eq("user_id", studentId);

  if (error) {
    console.error("Subject access loading error:", error);
    return;
  }

  const grantedSlugs = (data || [])
    .map((item) => item.slug)
    .filter(Boolean);

  const grantedNames = (data || [])
    .map((item) => item.subject_name)
    .filter(Boolean);

  const checkboxes = document.querySelectorAll('#subjects-list input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    const slug = checkbox.value;
    const name = checkbox.dataset.subjectName || "";

    checkbox.checked =
      grantedSlugs.includes(slug) || grantedNames.includes(name);
  });
}

async function saveAccess() {
  if (!selectedStudentId) {
    alert("Алдымен оқушыны таңда");
    return;
  }

  const checkedSubjects = Array.from(
    document.querySelectorAll('#subjects-list input[type="checkbox"]:checked')
  ).map((checkbox) => ({
    user_id: selectedStudentId,
    subject_name: checkbox.dataset.subjectName,
    slug: checkbox.value
  }));

  const saveBtn = document.getElementById("save-access-btn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Сақталуда...";
  }

  const { error: deleteError } = await supabaseClient
    .from("subject_access")
    .delete()
    .eq("user_id", selectedStudentId);

  if (deleteError) {
    console.error("Delete access error:", deleteError);
    alert(`Ескі доступты өшіру кезінде қате шықты:\n${deleteError.message}`);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Сақтау";
    }
    return;
  }

  if (checkedSubjects.length > 0) {
    const { error: insertError } = await supabaseClient
      .from("subject_access")
      .insert(checkedSubjects);

    if (insertError) {
      console.error("Insert access error:", insertError);
      alert(`Жаңа доступты сақтау кезінде қате шықты:\n${insertError.message}`);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Сақтау";
      }
      return;
    }
  }

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = "Сақтау";
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

document.addEventListener("DOMContentLoaded", async () => {
  setupStudentSearch();
  setupSaveButton();
  await loadStudents();
  await loadSubjects();
});

window.selectStudent = selectStudent;