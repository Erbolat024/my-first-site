const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

/* ---------------- REVEAL ANIMATION ---------------- */

function revealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) return;

  const windowHeight = window.innerHeight;

  reveals.forEach((item) => {
    const elementTop = item.getBoundingClientRect().top;
    const elementVisible = 100;

    if (elementTop < windowHeight - elementVisible) {
      item.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
document.addEventListener("DOMContentLoaded", revealOnScroll);

/* ---------------- REGISTER ---------------- */

window.registerUser = async function () {
  if (!supabaseClient) {
    alert("Supabase қосылмады");
    return;
  }

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

  const { error } = await supabaseClient.auth.signUp({
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
    alert("Қате: " + error.message);
    return;
  }

  localStorage.setItem("pending_email", email);
  localStorage.setItem("pending_name", name);
  localStorage.setItem("pending_phone", phone);

  alert("Email-ге код жіберілді!");
  window.location.href = "verify.html";
};

/* ---------------- VERIFY OTP ---------------- */

window.verifyCode = async function () {
  if (!supabaseClient) {
    alert("Supabase қосылмады");
    return;
  }

  const codeInput = document.getElementById("verify-code");

  if (!codeInput) {
    alert("Код өрісі табылмады");
    return;
  }

  const code = codeInput.value.trim();
  const email = localStorage.getItem("pending_email");
  const name = localStorage.getItem("pending_name");
  const phone = localStorage.getItem("pending_phone");

  if (!email) {
    alert("Email табылмады, қайта тіркеліңіз");
    window.location.href = "register.html";
    return;
  }

  if (!code) {
    alert("Кодты енгізіңіз");
    return;
  }

  const { error } = await supabaseClient.auth.verifyOtp({
    email: email,
    token: code,
    type: "email"
  });

  if (error) {
    alert("Қате: " + error.message);
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

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
      alert("Профиль сақтау қатесі: " + profileError.message);
      return;
    }
  }

  localStorage.removeItem("pending_email");
  localStorage.removeItem("pending_name");
  localStorage.removeItem("pending_phone");

  alert("Аккаунт расталды!");
  window.location.href = "../cabinet/index.html";
};

/* ---------------- LOGIN ---------------- */

window.loginUser = async function () {
  if (!supabaseClient) {
    alert("Supabase қосылмады");
    return;
  }

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
    return;
  }

  alert("Кіру сәтті өтті!");
  window.location.href = "../cabinet/index.html";
};

/* ---------------- RESET PASSWORD ---------------- */

window.resetPassword = async function () {
  if (!supabaseClient) {
    alert("Supabase қосылмады");
    return;
  }

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
    redirectTo: "https://erbolat024.github.io/my-first-site/pages/update-password.html"
  });

  if (error) {
    alert("Қате: " + error.message);
    return;
  }

  alert("Поштаға сілтеме жіберілді ✅");
};

/* ---------------- LOGOUT ---------------- */

window.logoutUser = async function () {
  if (!supabaseClient) {
    alert("Supabase қосылмады");
    return;
  }

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Қате: " + error.message);
    return;
  }

  window.location.href = "../pages/login.html";
};
