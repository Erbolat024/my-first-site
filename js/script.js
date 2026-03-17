const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

/* ---------------- REGISTER ---------------- */

async function registerUser() {
  if (!supabaseClient) return;

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) {
    alert("Тіркелу өрістері табылмады");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Email мен парольді толтырыңыз");
    return;
  }

  if (password.length < 6) {
    alert("Пароль кемінде 6 символ болуы керек");
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert("Қате: " + error.message);
  } else {
    alert("Тіркелу сәтті өтті!");
    window.location.href = "login.html";
  }
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
    alert("Қате: " + error.message);
  } else {
    alert("Кіру сәтті өтті!");
    window.location.href = "dashboard.html";
  }
}

/* ---------------- CHECK USER ---------------- */

async function checkUser() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "login.html";
  } else {
    const userEmail = document.getElementById("user-email");

    if (userEmail) {
      userEmail.textContent = "Сіздің email: " + data.user.email;
    }
  }
}

/* ---------------- LOGOUT ---------------- */

async function logoutUser() {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Қате: " + error.message);
    return;
  }

  alert("Сіз аккаунттан шықтыңыз");
  window.location.href = "../index.html";
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
    redirectTo: window.location.origin + "/my-first-site/pages/update-password.html"
  });

  if (error) {
    alert("Қате: " + error.message);
  } else {
    alert("Поштаңызға парольді қалпына келтіру сілтемесі жіберілді");
  }
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
    alert("Жаңа пароль кемінде 6 символ болуы керек");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword
  });

  if (error) {
    alert("Қате: " + error.message);
  } else {
    alert("Пароль сәтті өзгертілді");
    window.location.href = "login.html";
  }
}

/* ---------------- REVEAL ANIMATION ---------------- */

function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;
    const visiblePoint = 100;

    if (elementTop < windowHeight - visiblePoint) {
      element.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
