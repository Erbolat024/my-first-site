const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const logoutBtn = document.getElementById("logout-btn");

  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");
  const userPhone = document.getElementById("user-phone");
  const userSubject = document.getElementById("user-subject");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }

  if (!supabaseClient) return;

  const {
    data: { session },
    error: sessionError,
  } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "../index.html";
    return;
  }

  const user = session.user;
  const { data: profile, error: profileError } = await supabaseClient
  .from("profiles")
  .select("name, phone, email, available_subjects")
  .eq("email", user.email)
  .single();

  console.log("AUTH USER ID:", user.id);
  console.log("PROFILE DATA:", profile);
  if (profileError) {
    console.log("PROFILE ERROR:", profileError.message);
  }

  if (userName) {
    userName.textContent = profile?.name || "Көрсетілмеген";
  }

  if (userEmail) {
    userEmail.textContent = profile?.email || user.email || "Көрсетілмеген";
  }

  if (userPhone) {
    userPhone.textContent = profile?.phone || "Көрсетілмеген";
  }

  if (userSubject) {
    if (profile?.available_subjects && Array.isArray(profile.available_subjects)) {
      userSubject.textContent = profile.available_subjects.length
        ? profile.available_subjects.join(", ")
        : "Көрсетілмеген";
    } else {
      userSubject.textContent = "Көрсетілмеген";
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "../index.html";
    });
  }
});