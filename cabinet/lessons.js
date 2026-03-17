const sections = {
  1: {
    title: "🧬 Жасуша және биохимия",
    desc: "1–10 сабақ",
    lessons: [
      "Жасуша теориясы",
      "Жасуша құрылысы",
      "Жасуша мембранасы",
      "Органоидтар",
      "Ядро және хромосомалар",
      "ДНҚ құрылысы",
      "РНҚ түрлері",
      "Ақуыз биосинтезі",
      "Ферменттер",
      "Зат алмасу"
    ]
  },
  2: {
    title: "🫀 Адам анатомиясы",
    desc: "11–20 сабақ",
    lessons: [
      "Қан және оның құрамы",
      "Жүрек құрылысы",
      "Қан айналым шеңберлері",
      "Тыныс алу мүшелері",
      "Ас қорыту жүйесі",
      "Зәр шығару жүйесі",
      "Жүйке жүйесі",
      "Ми бөлімдері",
      "Сезім мүшелері",
      "Эндокриндік жүйе"
    ]
  },
  3: {
    title: "🧪 Генетика",
    desc: "21–30 сабақ",
    lessons: [
      "Генетика ғылымы",
      "Мендельдің I заңы",
      "Мендельдің II заңы",
      "Генотип және фенотип",
      "Доминантты және рецессивті белгілер",
      "Хромосомалық теория",
      "Мутациялар",
      "Тұқым қуалайтын аурулар",
      "Генетикалық есептер",
      "Популяциялық генетика"
    ]
  },
  4: {
    title: "🐒 Эволюция",
    desc: "31–40 сабақ",
    lessons: [
      "Эволюция ұғымы",
      "Дарвин ілімі",
      "Табиғи сұрыпталу",
      "Түр түзілу",
      "Эволюция дәлелдері",
      "Адам эволюциясы",
      "Микроэволюция",
      "Макроэволюция",
      "Бейімделу",
      "Биологиялық прогресс және регресс"
    ]
  },
  5: {
    title: "🌍 Экология",
    desc: "41–50 сабақ",
    lessons: [
      "Экология негіздері",
      "Экожүйе",
      "Қоректік тізбек",
      "Биосфера",
      "Популяция",
      "Қоршаған орта факторлары",
      "Ластану түрлері",
      "Қызыл кітап",
      "Табиғатты қорғау",
      "Климат және экология"
    ]
  },
  6: {
    title: "🌿 Өсімдіктер және микроорганизмдер",
    desc: "51–60 сабақ",
    lessons: [
      "Өсімдік жасушасы",
      "Фотосинтез",
      "Тамыр",
      "Сабақ",
      "Жапырақ",
      "Өсімдіктің көбеюі",
      "Өсімдіктер систематикасы",
      "Бактериялар",
      "Вирустар",
      "Қайталау сабағы"
    ]
  }
};

const params = new URLSearchParams(window.location.search);
const sectionId = params.get("section");

const section = sections[sectionId];
const titleEl = document.getElementById("sectionTitle");
const descEl = document.getElementById("sectionDesc");
const container = document.getElementById("lessonsContainer");

const progressData = JSON.parse(localStorage.getItem("biologyProgress")) || {};

function getLessonStatus(lessonNumber) {
  const progress = progressData[lessonNumber];

  if (!progress || !progress.completed) {
    return {
      text: "⏳ Тапсырылмаған",
      className: "status-not-started"
    };
  }

  if (progress.passed) {
    return {
      text: `✅ Өтті — ${progress.percent}%`,
      className: "status-passed"
    };
  }

  return {
    text: `❌ Өтпеді — ${progress.percent}%`,
    className: "status-failed"
  };
}

if (section) {
  titleEl.textContent = section.title;
  descEl.textContent = section.desc;

  section.lessons.forEach((lessonName, index) => {
    const card = document.createElement("div");
    card.className = "lesson-card";

    const lessonNumber = (Number(sectionId) - 1) * 10 + index + 1;
    const status = getLessonStatus(lessonNumber);

    card.innerHTML = `
      <h3>${lessonNumber}-сабақ</h3>
      <p>${lessonName}</p>
      <div class="lesson-status ${status.className}">${status.text}</div>

      <div class="lesson-actions">
        <a href="lesson-item.html?lesson=${lessonNumber}" class="lesson-btn">Ашу</a>
        <a href="test.html?lesson=${lessonNumber}" class="lesson-btn secondary-btn">Тест тапсыру</a>
      </div>
    `;

    container.appendChild(card);
  });
} else {
  titleEl.textContent = "Бөлім табылмады";
  descEl.textContent = "Қайтадан биология бетінен кіріп көріңіз";
}
