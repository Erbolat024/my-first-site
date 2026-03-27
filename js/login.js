const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("message");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    messageBox.textContent = "Жүктелуде...";

    try {
      const { data: authData, error: authError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (authError) throw authError;

      const user = authData.user;

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role === "student") {
        window.location.href = "../cabinet/student/index.html";
        return;
      }

      if (
        profile.role === "super_admin" ||
        profile.role === "curator" ||
        profile.role === "content_manager"
      ) {
        window.location.href = "../cabinet/admin/dashboard.html";
        return;
      }

      messageBox.textContent = "Рөл табылмады";
    } catch (error) {
      console.error(error);
      messageBox.textContent = error.message || "Қате пайда болды";
    }
  });
}