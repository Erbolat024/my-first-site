function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    section: params.get("section"),
    lesson: params.get("lesson")
  };
}

async function loadLesson() {
  const { subject, section, lesson } = getParams();

  const titleEl = document.getElementById("lesson-title");
  const descEl = document.getElementById("lesson-description");
  const textEl = document.getElementById("lesson-text");
  const videoEl = document.getElementById("lesson-video");
  const testBtn = document.getElementById("test-btn");

  if (!lesson) {
    textEl.innerHTML = "Сабақ табылмады";
    return;
  }

  const { data, error } = await supabaseClient
    .from("lessons")
    .select("*")
    .eq("id", lesson)
    .maybeSingle();

  if (error || !data) {
    console.error(error);
    textEl.innerHTML = "Қате";
    return;
  }

  // title
  titleEl.textContent = data.title || "Сабақ";

  // description
  descEl.textContent = data.description || "";

  // content
  textEl.innerHTML = data.content || "Контент жоқ";

  // video
  if (data.video) {
    videoEl.innerHTML = `
      <iframe 
        src="${data.video}" 
        frameborder="0" 
        allowfullscreen>
      </iframe>
    `;
  }

  // test button
  testBtn.href = `test.html?lesson=${lesson}`;
}

document.addEventListener("DOMContentLoaded", loadLesson);