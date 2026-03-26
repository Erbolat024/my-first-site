const supabaseClient = window.supabaseClient;

let groupsData = [];
let studentsData = [];

async function loadGroups() {
  const datalist = document.getElementById("groupsListData");
  if (!datalist) return;

  const { data, error } = await supabaseClient
    .from("groups")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    console.error("Топтарды жүктеу қатесі:", error.message);
    return;
  }

  groupsData = data || [];
  datalist.innerHTML = "";

  groupsData.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.name;
    datalist.appendChild(option);
  });
}

async function loadStudents() {
  const datalist = document.getElementById("studentsListData");
  if (!datalist) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, email")
    .eq("role", "student")
    .order("name", { ascending: true });

  if (error) {
    console.error("Студенттерді жүктеу қатесі:", error.message);
    return;
  }

  studentsData = data || [];
  datalist.innerHTML = "";

  studentsData.forEach((student) => {
    const option = document.createElement("option");
    option.value = `${student.name || "Аты жоқ"}${student.email ? " — " + student.email : ""}`;
    datalist.appendChild(option);
  });
}

function getSelectedGroup() {
  const input = document.getElementById("groupSearch");
  if (!input) return null;

  const value = input.value.trim();
  return groupsData.find((group) => group.name === value) || null;
}

function getSelectedStudent() {
  const input = document.getElementById("studentSearch");
  if (!input) return null;

  const value = input.value.trim();

  return (
    studentsData.find(
      (student) =>
        `${student.name || "Аты жоқ"}${student.email ? " — " + student.email : ""}` === value
    ) || null
  );
}

async function assignStudentToGroup() {
  const group = getSelectedGroup();
  const student = getSelectedStudent();

  if (!group) {
    alert("Топты тізімнен дұрыс таңда");
    return;
  }

  if (!student) {
    alert("Студентті тізімнен дұрыс таңда");
    return;
  }

  const { data: existing, error: checkError } = await supabaseClient
    .from("group_students")
    .select("id")
    .eq("group_id", group.id)
    .eq("student_id", student.id);

  if (checkError) {
    console.error("Тексеру қатесі:", checkError.message);
    alert("Қате: " + checkError.message);
    return;
  }

  if (existing && existing.length > 0) {
    alert("Бұл студент осы топта already бар");
    return;
  }

  const { error } = await supabaseClient
    .from("group_students")
    .insert([
      {
        group_id: group.id,
        student_id: student.id
      }
    ]);

  if (error) {
    console.error("Қосу қатесі:", error.message);
    alert("Қате: " + error.message);
    return;
  }

  alert("Студент топқа қосылды");

  document.getElementById("studentSearch").value = "";
  await loadGroupStudents(group.id);
}

async function removeStudentFromGroup(groupStudentId, groupId) {
  const isConfirmed = confirm("Осы студентті топтан алып тастаймыз ба?");
  if (!isConfirmed) return;

  const { error } = await supabaseClient
    .from("group_students")
    .delete()
    .eq("id", groupStudentId);

  if (error) {
    console.error("Өшіру қатесі:", error.message);
    alert("Қате: " + error.message);
    return;
  }

  alert("Студент топтан өшірілді");
  await loadGroupStudents(groupId);
}

async function loadGroupStudents(groupId) {
  const studentsList = document.getElementById("studentsList");
  if (!studentsList) return;

  if (!groupId) {
    studentsList.innerHTML = "Топ таңдаңыз";
    return;
  }

  studentsList.innerHTML = "Жүктелуде...";

  const { data, error } = await supabaseClient
    .from("group_students")
    .select("id, student_id")
    .eq("group_id", groupId)
    .order("id", { ascending: false });

  if (error) {
    console.error("Топ студенттерін жүктеу қатесі:", error.message);
    studentsList.innerHTML = `<p>Қате: ${error.message}</p>`;
    return;
  }

  if (!data || !data.length) {
    studentsList.innerHTML = "<p>Бұл топта студенттер әлі жоқ</p>";
    return;
  }

  const studentIds = data.map((item) => item.student_id);

  const { data: profiles, error: profilesError } = await supabaseClient
    .from("profiles")
    .select("id, name, email")
    .in("id", studentIds);

  if (profilesError) {
    console.error("Профильдерді жүктеу қатесі:", profilesError.message);
    studentsList.innerHTML = `<p>Қате: ${profilesError.message}</p>`;
    return;
  }

  studentsList.innerHTML = "";

  data.forEach((item) => {
  const student = profiles.find((p) => p.id === item.student_id);
  if (!student) return;

  const div = document.createElement("div");
  div.className = "student-item";
  div.innerHTML = `
    <div class="student-info">
      <div class="student-name">${student.name || "Аты жоқ"}</div>
      <div class="student-email">${student.email || ""}</div>
    </div>
    <button class="remove-btn">Өшіру</button>
  `;

  studentsList.appendChild(div);

  const removeBtn = div.querySelector(".remove-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      removeStudentFromGroup(item.id, groupId);
    });
  }
});
}

document.addEventListener("DOMContentLoaded", async () => {
  const assignBtn = document.getElementById("assignBtn");
  const groupSearch = document.getElementById("groupSearch");

  if (assignBtn) {
    assignBtn.addEventListener("click", assignStudentToGroup);
  }

  if (groupSearch) {
    groupSearch.addEventListener("change", async () => {
      const group = getSelectedGroup();
      await loadGroupStudents(group ? group.id : null);
    });

    groupSearch.addEventListener("input", async () => {
      const group = getSelectedGroup();
      if (!group) {
        const studentsList = document.getElementById("studentsList");
        if (studentsList) {
          studentsList.innerHTML = "Топ таңдаңыз";
        }
        return;
      }
      await loadGroupStudents(group.id);
    });
  }

  await loadGroups();
  await loadStudents();
});
