const supabaseUrl = "https://ewpouavcxepprlhppyal.supabase.co";
const supabaseKey = "sb_publishable__L6lwv9FNWNDYeLMD1SK2g_PU6Gn-EW";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    lessonId: params.get("id"),
    sectionId: params.get("section")
  };
}

function getEmbedUrl(url) {
  if (!url) return "";

  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}

async function loadLesson() {
  const { lessonId, sectionId } = getParams();

  const titleEl = document.getElementById("lesson-title");
  const descEl = document.getElementById("lesson-description");
  const videoEl = document.getElementById("video-container");
  const summaryEl = document.getElementById("lesson-summary");

  const backLink = document.getElementById("back-link");
  const lessonListBtn = document.getElementById("lesson-list-btn");
  const testBtn = document.getElementById("test-btn");

  if (!lessonId) {
    showError("Сабақ ID табылмады");
    return;
  }

  try {
    const { data: lesson, error } = await supabaseClient
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();

    if (error) throw error;

    if (titleEl) titleEl.textContent = lesson.title || "Сабақ";
    if (descEl) descEl.textContent = lesson.description || "";

    if (videoEl) {
      if (lesson.video) {
        const embedUrl = getEmbedUrl(lesson.video);

        videoEl.innerHTML = `
          <iframe
            width="100%"
            height="400"
            src="${embedUrl}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        `;
      } else {
        videoEl.innerHTML = `<p class="empty-text">Видео жоқ</p>`;
      }
    }

    if (summaryEl) {
      summaryEl.innerHTML = lesson.content
        ? `<p>${lesson.content.replace(/\n/g, "<br>")}</p>`
        : `<p class="empty-text">Конспект жоқ</p>`;
    }

    if (sectionId) {
      const backUrl = `lesson-list.html?section=${sectionId}`;
      if (backLink) backLink.href = backUrl;
      if (lessonListBtn) lessonListBtn.href = backUrl;
      if (testBtn) testBtn.href = `test.html?section=${sectionId}&id=${lessonId}`;
    }
  } catch (error) {
    console.error("Lesson error:", error);
    showError("Сабақ жүктелмеді");
  }
}

function showError(message) {
  const titleEl = document.getElementById("lesson-title");
  const descEl = document.getElementById("lesson-description");
  const videoEl = document.getElementById("video-container");
  const summaryEl = document.getElementById("lesson-summary");

  if (titleEl) titleEl.textContent = "Қате";
  if (descEl) descEl.textContent = message;
  if (videoEl) videoEl.innerHTML = `<p class="empty-text">Видео жүктелмеді</p>`;
  if (summaryEl) summaryEl.innerHTML = `<p class="empty-text">Конспект жүктелмеді</p>`;
}

loadLesson();