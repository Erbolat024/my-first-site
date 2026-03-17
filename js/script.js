const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

/* ---------------- REGISTER ---------------- */

async function registerUser() {
  if (!supabaseClient) return;

  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!nameInput || !phoneInput || !emailInput || !passwordInput) {
    alert("Тіркелу өрістері табылмады");
    return;
  }

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !phone || !email || !password) {
    alert("Барлық өрісті толтырыңыз");
    return;
  }

  if (password.length < 6) {
    alert("Пароль кемінде 6 символ болуы керек");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name,
        phone: phone
      }
    }
  });

  if (error) {
    console.log("FULL ERROR:", error);
    alert("Қате: " + error.message);
    return;
  }

  const user = data?.user;

  if (user) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert([
        {
          id: user.id,
          name: name,
          phone: phone,
          email: email,
          available_subjects: []
        }
      ]);

    if (profileError) {
      console.log("PROFILE ERROR:", profileError);
      alert("Профиль сақтау қатесі: " + profileError.message);
      return;
    }
  }

  alert("Тіркелу сәтті өтті!");
  window.location.href = "login.html";
}

/* ---------------- LOGIN ---------------- */

async function loginUser() {
  if (!supabaseClient) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("Кіру өрістері табылмады");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Email мен парольді толтырыңыз");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.log("LOGIN ERROR:", error);
    alert("Қате: " + error.message);
    return;
  }

  alert("Кіру сәтті өтті!");
  window.location.href = "../cabinet/index.html";
}

/* ---------------- LOGOUT ---------------- */

async function logoutUser() {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.log("LOGOUT ERROR:", error);
    alert("Қате: " + error.message);
    return;
  }

  alert("Сіз аккаунттан шықтыңыз");
  window.location.href = "../pages/login.html";
}

/* ---------------- RESET PASSWORD EMAIL ---------------- */

async function resetPassword() {
  if (!supabaseClient) return;

  const emailInput = document.getElementById("reset-email");

  if (!emailInput) {
    alert("Email өрісі табылмады");
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    alert("Email енгізіңіз");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/pages/update-password.html"
  });

  if (error) {
    console.log("RESET PASSWORD ERROR:", error);
    alert("Қате: " + error.message);
    return;
  }

  alert("Поштаңызға сілтеме жіберілді");
}

/* ---------------- UPDATE PASSWORD ---------------- */

async function updatePassword() {
  if (!supabaseClient) return;

  const passwordInput = document.getElementById("new-password");

  if (!passwordInput) {
    alert("Жаңа пароль өрісі табылмады");
    return;
  }

  const newPassword = passwordInput.value.trim();

  if (!newPassword) {
    alert("Жаңа пароль енгізіңіз");
    return;
  }

  if (newPassword.length < 6) {
    alert("Пароль кемінде 6 символ болуы керек");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.log("UPDATE PASSWORD ERROR:", error);
    alert("Қате: " + error.message);
    return;
  }

  alert("Пароль өзгертілді");
  window.location.href = "login.html";
}
