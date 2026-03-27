const sb = window.supabaseClient;

const lessonTitle = document.getElementById("lessonTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const subjectBadge = document.getElementById("subjectBadge");
const sectionBadge = document.getElementById("sectionBadge");

const videoInput = document.getElementById("videoInput");
const descriptionInput = document.getElementById("descriptionInput");
const contentInput = document.getElementById("contentInput");

const saveLessonBtn = document.getElementById("saveLessonBtn");
const backToLessonsBtn = document.getElementById("backToLessonsBtn");
const videoFrame = document.getElementById("videoFrame");

let currentLessonId = null;
let currentSubject = null;
let currentSectionId = null;
let currentSection = null;
let currentLesson = null;

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    section: params.get("section"),
    lesson: params.get("lesson")
  };
}

function getEmbedUrl(url) {
  if (!url) return "";

  // youtube watch?v=
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  // youtu.be short link
  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // already embed
  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  return "";
}

function updateVideoPreview() {
  const url = videoInput.value.trim();
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    videoFrame.src = "";
    return;
  }

  videoFrame.src = embedUrl;
}

async function loadSection(sectionId) {
  const { data, error } = await sb
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .single();

  if (error || !data) {
    console.error("Бөлімді жүктеу қатесі:", error);
    return null;
  }

  return data;
}

async function loadLesson() {
  const { subject, section, lesson } = getParams();

  if (!subject || !section || !lesson) {
    alert("Пән, бөлім немесе сабақ параметрі жоқ");
    window.location.href = "lesson-editor.html";
    return false;
  }

  currentSubject = subject;
  currentSectionId = Number(section);
  currentLessonId = Number(lesson);

  currentSection = await loadSection(currentSectionId);

  const { data, error } = await sb
    .from("lessons")
    .select("*")
    .eq("id", currentLessonId)
    .single();

  if (error || !data) {
    console.error("Сабақты жүктеу қатесі:", error);
    alert("Сабақ табылмады");
    window.location.href = `lesson-editor.html?subject=${subject}&section=${section}`;
    return false;
  }

  currentLesson = data;

  if (lessonTitle) {
    lessonTitle.textContent = data.title || "Сабақ";
  }

  if (pageSubtitle) {
    pageSubtitle.textContent = `Пән: ${subject} | Бөлім: ${currentSection ? currentSection.title : section}`;
  }

  if (subjectBadge) {
    subjectBadge.textContent = subject;
  }

  if (sectionBadge) {
    sectionBadge.textContent = currentSection ? currentSection.title : `ID: ${section}`;
  }

  videoInput.value = data.video || "";
  descriptionInput.value = data.description || "";
  contentInput.value = data.content || "";

  updateVideoPreview();

  if (backToLessonsBtn) {
    backToLessonsBtn.href = `lesson-editor.html?subject=${subject}&section=${section}`;
  }

  return true;
}

async function saveLessonContent() {
  if (!currentLessonId) return;

  const payload = {
    video: videoInput.value.trim(),
    description: descriptionInput.value.trim(),
    content: contentInput.value.trim()
  };

  const { error } = await sb
    .from("lessons")
    .update(payload)
    .eq("id", currentLessonId);

  if (error) {
    console.error("Сабақты сақтау қатесі:", error);
    alert("Сақтау кезінде қате шықты");
    return;
  }

  alert("Сабақ контенті сәтті сақталды");
}

if (videoInput) {
  videoInput.addEventListener("input", updateVideoPreview);
}

if (saveLessonBtn) {
  saveLessonBtn.addEventListener("click", saveLessonContent);
}

async function initPage() {
  await loadLesson();
}

initPage();