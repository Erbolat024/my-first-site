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
    alert("Қате: " + error.message);
    return;
  }

  // 🔥 EMAIL сақтаймыз
  localStorage.setItem("pending_email", email);

  alert("Email-ге код жіберілді!");

  // 🔥 VERIFY PAGE
  window.location.href = "/pages/verify.html";
}

/* ---------------- VERIFY OTP ---------------- */

async function verifyCode() {
  if (!supabaseClient) return;

  const codeInput = document.getElementById("verify-code");

  if (!codeInput) {
    alert("Код өрісі табылмады");
    return;
  }

  const code = codeInput.value.trim();
  const email = localStorage.getItem("pending_email");

  if (!email) {
    alert("Email табылмады, қайта тіркеліңіз");
    window.location.href = "/pages/register.html";
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

  // 🔥 PROFILE сақтау осы жерде (confirm болған соң)
  const user = (await supabaseClient.auth.getUser()).data.user;

  if (user) {
    await supabaseClient.from("profiles").upsert([
      {
        id: user.id,
        email: user.email
      }
    ]);
  }

  localStorage.removeItem("pending_email");

  alert("Аккаунт расталды!");
  window.location.href = "/pages/login.html";
}
function goToVerify() {
  const name = document.getElementById("name")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!name || !phone || !email || !password) {
    alert("Барлық өрісті толтырыңыз");
    return;
  }

  // 🔥 сақтап қоямыз (кейін керек болады)
  localStorage.setItem("pending_email", email);

  // 🔥 өтеміз
  window.location.href = "/pages/verify.html";
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
    return;
  }

  alert("Кіру сәтті өтті!");
  window.location.href = "../cabinet/index.html";
}

/* ---------------- LOGOUT ---------------- */

async function logoutUser() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signOut();
  window.location.href = "../pages/login.html";
}
