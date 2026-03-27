async function initLayout() {
  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.href = "/pages/login.html";
    return;
  }

  // USER NAME
  const nameEl = document.getElementById("user-name");

  if (nameEl) {
    const { data } = await supabaseClient
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    nameEl.textContent = data?.name || "қолданушы";
  }

  // DASHBOARD STATS
  await loadDashboardStats(user.id);

  // LOGOUT
 const BASE_URL = window.location.hostname.includes("github.io")
  ? "/my-first-site"
  : "";

const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = `${BASE_URL}/pages/login.html`;
  });
}

  // SIDEBAR TOGGLE
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menu-toggle");

  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }
}

// 📊 STATS
async function loadDashboardStats(userId) {
  // SUBJECTS COUNT
  const { data: subjects } = await supabaseClient
    .from("subject_access")
    .select("id")
    .eq("user_id", userId);

  const subjectsEl = document.getElementById("subjects-count");
  if (subjectsEl) {
    subjectsEl.textContent = subjects?.length || 0;
  }

  // TEST COUNT (localStorage)
  let testCount = 0;

  for (let key in localStorage) {
    if (key.includes("_lesson_") && key.includes("_result")) {
      testCount++;
    }
  }

  const testEl = document.getElementById("tests-count");
  if (testEl) {
    testEl.textContent = testCount;
  }
}

document.addEventListener("DOMContentLoaded", initLayout);
