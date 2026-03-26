let allUsers = [];

async function loadUsers() {
  const table = document.getElementById("users-table");

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, name, email, role")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  allUsers = data;
  renderUsers(allUsers);
}

function renderUsers(users) {
  const table = document.getElementById("users-table");

  table.innerHTML = users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>
        <select id="role-${user.id}">
          <option value="student" ${user.role === "student" ? "selected" : ""}>student</option>
          <option value="curator" ${user.role === "curator" ? "selected" : ""}>curator</option>
          <option value="content_manager" ${user.role === "content_manager" ? "selected" : ""}>content_manager</option>
          <option value="super_admin" ${user.role === "super_admin" ? "selected" : ""}>super_admin</option>
        </select>
      </td>
      <td>
        <button onclick="updateRole('${user.id}')">Сақтау</button>
      </td>
    </tr>
  `).join("");
}

async function updateRole(userId) {
  const select = document.getElementById(`role-${userId}`);
  const newRole = select.value;

  await supabaseClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  alert("Сақталды ✅");
}

// 🔍 SEARCH
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search-input");

  if (input) {
    input.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase();

      const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value)
      );

      renderUsers(filtered);
    });
  }
});

loadUsers();