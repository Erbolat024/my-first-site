const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

async function checkUser() {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "../pages/login.html";
    return null;
  }

  return data.user;
}

async function logoutUser() {
  try {
    if (!supabaseClient) return;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      alert("Шығу қатесі: " + error.message);
      return;
    }

    window.location.href = "../pages/login.html";
  } catch (err) {
    alert("Қате шықты: " + err.message);
  }
}

async function loadUserData() {
  if (!supabaseClient) return;

  const user = await checkUser();
  if (!user) return;

  const emailEl = document.getElementById("user-email");
  const nameEl = document.getElementById("user-name");
  const phoneEl = document.getElementById("user-phone");

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("name, phone, email")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Профильді оқу қатесі:", error.message);

    if (emailEl) emailEl.textContent = user.email || "-";
    if (nameEl) nameEl.textContent = "-";
    if (phoneEl) phoneEl.textContent = "-";
    return;
  }

  if (emailEl) {
    emailEl.textContent = data.email || user.email || "-";
  }

  if (nameEl) {
    nameEl.textContent = data.name || "-";
  }

  if (phoneEl) {
    phoneEl.textContent = data.phone || "-";
  }
}

async function loadAvailableSubjects() {
  if (!supabaseClient) return;

  const user = await checkUser();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("available_subjects")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Пәндерді оқу қатесі:", error.message);
    return;
  }

  const availableSubjects = data?.available_subjects || [];
  console.log("USER SUBJECTS:", availableSubjects);

  const subjectCards = document.querySelectorAll(".card[data-subject]");
  console.log("FOUND CARDS:", subjectCards.length);

  subjectCards.forEach((card) => {
    const subjectName = card.dataset.subject;
    console.log("CARD SUBJECT:", subjectName);

    if (!availableSubjects.includes(subjectName)) {
      card.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  await loadUserData();

  const isSubjectsPage =
    window.location.pathname.includes("subjects.html") ||
    window.location.pathname.endsWith("/subjects") ||
    document.querySelector(".card[data-subject]");

  if (isSubjectsPage) {
    await loadAvailableSubjects();
  }
});
