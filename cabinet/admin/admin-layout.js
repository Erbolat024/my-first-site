const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function initAdmin() {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  // ❌ user жоқ → login
  if (userError || !user) {
    window.location.href = "../../pages/login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    alert("Профиль табылмады");
    window.location.href = "../../pages/login.html";
    return;
  }

  const role = profile.role;

  // ❌ student → admin-ға кірмеу керек
  if (role === "student") {
    window.location.href = "../index.html";
    return;
  }

  renderMenu(role);
  setActivePage();
  initDropdowns();
}

function renderMenu(role) {
  const menu = document.getElementById("menu");
  if (!menu) return;

  let html = "";

  if (role === "super_admin") {
    html = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="users.html">Аккаунттар</a></li>
      <li><a href="access.html">Доступ</a></li>

      <li class="has-submenu">
        <button class="submenu-toggle" type="button" data-target="groups-submenu">
          Топтар
        </button>
        <ul class="submenu" id="groups-submenu">
          <li><a href="groups.html">Топтар тізімі</a></li>
          <li><a href="group-students.html">Топқа студент қосу</a></li>
        </ul>
      </li>

      <li><a href="results.html">Нәтижелер</a></li>
      <li><a href="sections.html">Контент</a></li>
      <li><a href="#" data-logout="true">Шығу</a></li>
    `;
  } else if (role === "curator") {
    html = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="results.html">Нәтижелер</a></li>
      <li><a href="#" data-logout="true">Шығу</a></li>
    `;
  } else if (role === "content_manager") {
    html = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="sections.html">Контент</a></li>
      <li><a href="#" data-logout="true">Шығу</a></li>
    `;
  } else {
    html = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="#" data-logout="true">Шығу</a></li>
    `;
  }

  menu.innerHTML = html;

  // ✅ logout handler
  const logoutBtn = menu.querySelector('[data-logout="true"]');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
    });
  }
}

function setActivePage() {
  const currentPage = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll("#menu a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href === "#" || href.startsWith("#")) return;

    if (href === currentPage) {
      link.classList.add("active");

      const submenu = link.closest(".submenu");
      if (submenu) {
        submenu.classList.add("show");

        const parentLi = submenu.closest(".has-submenu");
        const toggleBtn = parentLi?.querySelector(".submenu-toggle");
        if (toggleBtn) {
          toggleBtn.classList.add("open");
        }
      }
    }
  });
}

function initDropdowns() {
  const toggleButtons = document.querySelectorAll(".submenu-toggle");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      if (!targetId) return;

      const submenu = document.getElementById(targetId);
      if (!submenu) return;

      submenu.classList.toggle("show");
      button.classList.toggle("open");
    });
  });
}

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  // ✅ ЕҢ ДҰРЫС ПУТЬ
  window.location.href = "../../pages/login.html";
}

initAdmin();