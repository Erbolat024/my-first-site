const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";

let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

const subjectInfo = {
  "Ағылшын": {
    icon: "🇬🇧",
    description: "Грамматика, сөздік қор, оқу және тыңдалым материалдары.",
    link: "subjects/english/agylshyn-bolimderi.html"
  },
  "Математикалық сауаттылық": {
    icon: "➕",
    description: "Есептер, логика, формулалар және практикалық тапсырмалар.",
    link: "subjects/mathematics/matematikalyk-sauattylyk-bolimderi.html"
  },
  "Оқу сауаттылығы": {
    icon: "📖",
    description: "Мәтінмен жұмыс, талдау, түсіну және жауап беру дағдылары.",
    link: "subjects/reading/oku-sauattylygy-bolimderi.html"
  },
  "Биология": {
    icon: "🧬",
    description: "Тірі ағзалар, адам анатомиясы, генетика және зертханалық тақырыптар.",
    link: "subjects/biology/biologiya-bolimderi.html"
  },
  "Химия": {
    icon: "⚗️",
    description: "Химиялық реакциялар, формулалар, элементтер және есептер.",
    link: "subjects/chemistry/himiya-bolimderi.html"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initSubjectsPage();
});

async function initSubjectsPage() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const logoutBtn = document.getElementById("logout-btn");
  const subjectsList = document.getElementById("subjects-list");

  setupSidebar(menuToggle, sidebar);
  setupLogout(logoutBtn);

  if (!supabaseClient) {
    renderError(subjectsList, "Supabase қосылмады.");
    return;
  }

  const user = await getCurrentUser();
  if (!user) return;

  await loadSubjects(user.id, subjectsList);
}

function setupSidebar(menuToggle, sidebar) {
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }
}

function setupLogout(logoutBtn) {
  if (!logoutBtn || !supabaseClient) return;

  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "../index.html";
  });
}

async function getCurrentUser() {
  const {
    data: { session },
    error: sessionError
  } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "../index.html";
    return null;
  }

  return session.user;
}

async function loadSubjects(userId, subjectsList) {
  if (!subjectsList) return;

  subjectsList.innerHTML = `
    <div class="card">
      <h3>Жүктелуде...</h3>
      <p>Пәндер жүктеліп жатыр.</p>
    </div>
  `;

  const { data: subjectAccess, error: subjectAccessError } = await supabaseClient
    .from("subject_access")
    .select("subject_name")
    .eq("user_id", userId);

  console.log("USER ID:", userId);
  console.log("SUBJECT ACCESS:", subjectAccess);
  console.log("SUBJECT ACCESS ERROR:", subjectAccessError);

  if (subjectAccessError) {
    renderError(subjectsList, "Пәндер жүктелмеді. subject_access table тексеріңіз.");
    return;
  }

  const availableSubjects = Array.isArray(subjectAccess)
    ? [...new Set(subjectAccess.map((item) => item.subject_name))]
    : [];

  if (!availableSubjects.length) {
    renderEmpty(subjectsList);
    return;
  }

  renderSubjects(subjectsList, availableSubjects);
}

function renderSubjects(subjectsList, availableSubjects) {
  subjectsList.innerHTML = "";

  availableSubjects.forEach((subjectName) => {
    const info = subjectInfo[subjectName] || {
      icon: "📚",
      description: "Бұл пән бойынша материалдар қолжетімді.",
      link: "#"
    };

    const card = document.createElement("div");
    card.className = "card subject-card";

    card.innerHTML = `
      <h3>${info.icon} ${subjectName}</h3>
      <p>${info.description}</p>
      <a href="${info.link}" class="open-btn">Ашу</a>
    `;

    subjectsList.appendChild(card);
  });
}

function renderEmpty(subjectsList) {
  subjectsList.innerHTML = `
    <div class="card">
      <h3>Пән жоқ</h3>
      <p>Сізге әлі пән берілмеген.</p>
    </div>
  `;
}

function renderError(subjectsList, message) {
  if (!subjectsList) return;

  subjectsList.innerHTML = `
    <div class="card">
      <h3>Қате</h3>
      <p>${message}</p>
    </div>
  `;
}