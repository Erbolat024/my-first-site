function getLessonId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadLesson() {
  const lessonId = getLessonId();

  if (!lessonId) {
    showError("Сабақ ID табылмады");
    return;
  }

  try {
    const response = await fetch("../data/lessons.json");

    if (!response.ok) {
      throw new Error(`lessons.json табылмады: ${response.status}`);
    }

    const lessons = await response.json();
    const lesson = lessons.find((item) => String(item.id) === String(lessonId));

    if (!lesson) {
      showError("Сабақ табылмады");
      return;
    }

    renderLesson(lesson);
  } catch (error) {
    console.error("Сабақты жүктеу қатесі:", error);
    showError("Сабақ жүктелмеді");
  }
}

function renderLesson(lesson) {
  const titleEl = document.getElementById("lesson-title");
  const descEl = document.getElementById("lesson-description");
  const summaryEl = document.getElementById("lesson-summary");
  const videoContainer = document.getElementById("video-container");
  const backLink = document.getElementById("back-link");
  const lessonListBtn = document.getElementById("lesson-list-btn");
  const testBtn = document.getElementById("test-btn");

  document.title = lesson.title;

  titleEl.textContent = lesson.title;
  descEl.textContent = lesson.description || "";

  if (lesson.video && lesson.video.trim() !== "") {
    videoContainer.innerHTML = `
      <iframe
        src="${lesson.video}"
        title="${lesson.title}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    `;
  } else {
    videoContainer.innerHTML = `
      <div class="video-placeholder">
        <p>Бұл сабаққа видео әлі қосылмаған</p>
      </div>
    `;
  }

  if (lesson.summary && lesson.summary.trim() !== "") {
    summaryEl.innerHTML = formatParagraphs(lesson.summary);
  } else {
    summaryEl.innerHTML = `
      <p class="empty-text">Бұл сабаққа конспект әлі қосылмаған</p>
    `;
  }

  const lessonListUrl = `lesson-list.html?section=${lesson.sectionId}`;
  const testUrl = `test.html?id=${lesson.id}&section=${lesson.sectionId}`;

  backLink.href = lessonListUrl;
  lessonListBtn.href = lessonListUrl;
  testBtn.href = testUrl;
}

function formatParagraphs(text) {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => `<p>${line.trim()}</p>`)
    .join("");
}

function showError(message) {
  const titleEl = document.getElementById("lesson-title");
  const descEl = document.getElementById("lesson-description");
  const summaryEl = document.getElementById("lesson-summary");
  const videoContainer = document.getElementById("video-container");

  document.title = "Сабақ табылмады";
  titleEl.textContent = message;
  descEl.textContent = "";
  videoContainer.innerHTML = `
    <div class="video-placeholder">
      <p>${message}</p>
    </div>
  `;
  summaryEl.innerHTML = `<p class="empty-text">Қайта тексеріп көр.</p>`;
}

loadLesson();
