

async function loadCurators() {
  const select = document.getElementById("curatorSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Куратор таңдау</option>`;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name")
    .eq("role", "curator");

  if (error) {
    console.error("Кураторларды жүктеу қатесі:", error.message);
    return;
  }

  if (!data || !data.length) return;

  data.forEach((curator) => {
    const option = document.createElement("option");
    option.value = curator.id;
    option.textContent = curator.name || "Аты жоқ";
    select.appendChild(option);
  });
}

async function createGroup() {
  const nameInput = document.getElementById("groupName");
  const curatorSelect = document.getElementById("curatorSelect");

  if (!nameInput || !curatorSelect) return;

  const name = nameInput.value.trim();
  const curatorId = curatorSelect.value || null;

  if (!name) {
    alert("Топ атын жаз");
    return;
  }

  const { error } = await supabaseClient
    .from("groups")
    .insert([{ name, curator_id: curatorId }]);

  if (error) {
    console.error("Топ сақтау қатесі:", error.message);
    alert("Қате: " + error.message);
    return;
  }

  nameInput.value = "";
  curatorSelect.value = "";
  await loadGroups();
  alert("Топ сақталды");
}

async function deleteGroup(groupId, groupName) {
  const isConfirmed = confirm(`"${groupName}" тобын өшіреміз бе?`);
  if (!isConfirmed) return;

  const { data: linkedStudents, error: checkError } = await supabaseClient
    .from("group_students")
    .select("id")
    .eq("group_id", groupId);

  if (checkError) {
    console.error("Тексеру қатесі:", checkError.message);
    alert("Қате: " + checkError.message);
    return;
  }

  if (linkedStudents && linkedStudents.length > 0) {
    const { error: deleteLinksError } = await supabaseClient
      .from("group_students")
      .delete()
      .eq("group_id", groupId);

    if (deleteLinksError) {
      console.error("Топ студенттерін өшіру қатесі:", deleteLinksError.message);
      alert("Қате: " + deleteLinksError.message);
      return;
    }
  }

  const { error } = await supabaseClient
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) {
    console.error("Топты өшіру қатесі:", error.message);
    alert("Қате: " + error.message);
    return;
  }

  alert("Топ өшірілді");
  await loadGroups();
}

async function loadGroups() {
  const container = document.getElementById("groupsList");
  if (!container) return;

  container.innerHTML = "Жүктелуде...";

  const { data, error } = await supabaseClient
    .from("groups")
    .select("id, name, curator_id, created_at")
    .order("id", { ascending: false });

  if (error) {
    console.error("Топтарды жүктеу қатесі:", error.message);
    container.innerHTML = `<p>Қате: ${error.message}</p>`;
    return;
  }

  if (!data || !data.length) {
    container.innerHTML = "<p>Топтар әлі жоқ</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach((group) => {
    const div = document.createElement("div");
    div.className = "group-item";
    div.innerHTML = `
      <div class="group-info">
        <strong>${group.name}</strong><br>
        <small>ID: ${group.id}</small>
      </div>
      <button class="delete-group-btn">Өшіру</button>
    `;

    container.appendChild(div);

    const deleteBtn = div.querySelector(".delete-group-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        deleteGroup(group.id, group.name);
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const saveBtn = document.getElementById("saveGroupBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", createGroup);
  }

  await loadCurators();
  await loadGroups();
});