const sb = window.supabaseClient;

const lessonTitle = document.getElementById("lessonTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const subjectBadge = document.getElementById("subjectBadge");
const sectionBadge = document.getElementById("sectionBadge");

const videoInput = document.getElementById("videoInput");
const videoFile = document.getElementById("videoFile");
const uploadVideoBtn = document.getElementById("uploadVideoBtn");

const videoPreview = document.getElementById("videoPreview");
const videoSource = document.getElementById("videoSource");

const descriptionInput = document.getElementById("descriptionInput");
const contentInput = document.getElementById("contentInput");

const saveLessonBtn = document.getElementById("saveLessonBtn");
const backToLessonsBtn = document.getElementById("backToLessonsBtn");

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

function updateVideoPreview(url = "") {
  if (!videoPreview || !videoSource) return;

  const cleanUrl = url.trim();

  if (!cleanUrl) {
    videoSource.src = "";
    videoPreview.style.display = "none";
    videoPreview.load();
    return;
  }

  videoSource.src = cleanUrl;
  videoPreview.style.display = "block";
  videoPreview.load();
}

async function uploadVideoToSupabase() {
  try {
    const file = videoFile?.files?.[0];

    if (!file) {
      alert("Алдымен видео таңда");
      return;
    }

    const safeName = file.name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    const filePath = `lessons/${Date.now()}_${safeName}`;

    uploadVideoBtn.disabled = true;
    uploadVideoBtn.textContent = "Жүктелуде...";

    const { data, error } = await sb.storage
      .from("videos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error("Видео жүктеу қатесі:", error);
      alert("Видео жүктелмеді: " + error.message);
      return;
    }

    const { data: publicData } = sb.storage
      .from("videos")
      .getPublicUrl(data.path);

    const publicUrl = publicData.publicUrl;

    videoInput.value = publicUrl;
    updateVideoPreview(publicUrl);

    alert("Видео сәтті жүктелді");
  } catch (err) {
    console.error("Upload exception:", err);
    alert("Қате шықты");
  } finally {
    uploadVideoBtn.disabled = false;
    uploadVideoBtn.textContent = "⬆ Видеоны жүктеу";
  }
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

  videoInput.value = data.video_url || data.video || "";
  descriptionInput.value = data.description || "";
  contentInput.value = data.content || "";

  updateVideoPreview(videoInput.value);

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
  videoInput.addEventListener("input", (e) => {
    updateVideoPreview(e.target.value);
  });
}

if (uploadVideoBtn) {
  uploadVideoBtn.addEventListener("click", uploadVideoToSupabase);
}

if (saveLessonBtn) {
  saveLessonBtn.addEventListener("click", saveLessonContent);
}

async function initPage() {
  await loadLesson();
}

initPage();