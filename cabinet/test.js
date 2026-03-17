const params = new URLSearchParams(window.location.search);
const lessonId = params.get("lesson");

const test = testsData[lessonId];
const container = document.getElementById("testContainer");

let userAnswers = [];

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

if (!test) {
  container.innerHTML = "<p>Тест табылмады</p>";
} else {
  test.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question";

    const shuffledAnswers = shuffleArray(
      q.answers.map((answer, i) => ({
        text: answer,
        originalIndex: i
      }))
    );

    div.innerHTML = `
      <p>${index + 1}. ${q.question}</p>
      <div class="answers">
        ${shuffledAnswers.map(answer => `
          <button onclick="selectAnswer(${index}, ${answer.originalIndex}, this)">
            ${answer.text}
          </button>
        `).join("")}
      </div>
    `;

    container.appendChild(div);
  });
}

function selectAnswer(qIndex, answerIndex, btn) {
  userAnswers[qIndex] = answerIndex;

  const buttons = btn.parentElement.querySelectorAll("button");
  buttons.forEach(b => {
    b.style.background = "#eef2ff";
    b.style.color = "#000";
  });

  btn.style.background = "#4c7cf6";
  btn.style.color = "#fff";
}

function checkTest() {
  if (!test) return;

  let score = 0;

  test.forEach((q, i) => {
    if (userAnswers[i] === q.correct) {
      score++;
    }
  });

  const percent = Math.round((score / test.length) * 100);
  const passed = percent >= 70;

  const resultText = passed
    ? `Нәтиже: ${score} / ${test.length} (${percent}%) ✅ Өтті`
    : `Нәтиже: ${score} / ${test.length} (${percent}%) ❌ Өтпеді`;

  document.getElementById("result").innerText = resultText;

  const progressData = JSON.parse(localStorage.getItem("biologyProgress")) || {};

  progressData[lessonId] = {
    score: score,
    total: test.length,
    percent: percent,
    passed: passed,
    completed: true,
    date: new Date().toLocaleString()
  };

  localStorage.setItem("biologyProgress", JSON.stringify(progressData));
}

function retryTest() {
  location.reload();
}
