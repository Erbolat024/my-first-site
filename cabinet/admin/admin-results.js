const groupSelect = document.getElementById("group");
const subjectSelect = document.getElementById("subject");
const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");
const filterBtn = document.getElementById("filter-btn");
const resultsContainer = document.getElementById("results-container");
const resultsSubtitle = document.getElementById("results-subtitle");

document.addEventListener("DOMContentLoaded", async () => {
  await loadGroups();
  setDefaultDates();
});

filterBtn.addEventListener("click", loadResults);

function setDefaultDates() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  dateToInput.value = formatDateInput(today);
  dateFromInput.value = formatDateInput(monthAgo);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return "—";

  return date.toLocaleString("kk-KZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

async function loadGroups() {
  try {
    const { data, error } = await supabaseClient
      .from("groups")
      .select("id, name")
      .order("id", { ascending: true });

    if (error) throw error;

    groupSelect.innerHTML = `<option value="">Топ таңдаңыз</option>`;

    data.forEach(group => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Топтарды жүктеу қатесі:", error);
    groupSelect.innerHTML = `<option value="">Топтар жүктелмеді</option>`;
  }
}

async function loadResults() {
  const groupId = groupSelect.value;
  const subject = subjectSelect.value;
  const dateFrom = dateFromInput.value;
  const dateTo = dateToInput.value;

  if (!groupId) {
    resultsSubtitle.textContent = "Алдымен топ таңдаңыз";
    resultsContainer.innerHTML = `<div class="empty-state">Алдымен топ таңдаңыз.</div>`;
    return;
  }

  resultsSubtitle.textContent = "Нәтижелер жүктелуде...";
  resultsContainer.innerHTML = `<div class="empty-state">Нәтижелер жүктелуде...</div>`;

  try {
    // 1. таңдалған топтағы студенттер
    const { data: groupStudents, error: groupStudentsError } = await supabaseClient
      .from("group_students")
      .select("student_id")
      .eq("group_id", groupId);

    if (groupStudentsError) throw groupStudentsError;

    const studentIds = [...new Set((groupStudents || []).map(item => item.student_id))];

    if (!studentIds.length) {
      resultsSubtitle.textContent = "Бұл топта студенттер жоқ";
      resultsContainer.innerHTML = `<div class="empty-state">Бұл топта студенттер жоқ.</div>`;
      return;
    }

    // 2. студенттердің профильдері
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("id, name, role")
      .in("id", studentIds);

    if (profilesError) throw profilesError;

    const profileMap = {};
    (profiles || []).forEach(profile => {
      profileMap[profile.id] = profile;
    });

    // 3. нәтижелерді алу
    let resultsQuery = supabaseClient
      .from("student_results")
      .select("id, student_id, subject_name, lesson_id, score, total, percent, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false });

    if (subject) {
      resultsQuery = resultsQuery.eq("subject_name", subject);
    }

    if (dateFrom) {
      resultsQuery = resultsQuery.gte("created_at", `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      resultsQuery = resultsQuery.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data: results, error: resultsError } = await resultsQuery;

    if (resultsError) throw resultsError;

    if (!results || !results.length) {
      resultsSubtitle.textContent = "Нәтиже табылмады";
      resultsContainer.innerHTML = `<div class="empty-state">Таңдалған фильтр бойынша нәтиже табылмады.</div>`;
      return;
    }

    // 4. әр student + subject + lesson бойынша тек соңғы результат
    const latestMap = new Map();

    results.forEach(item => {
      const key = `${item.student_id}_${item.subject_name}_${item.lesson_id}`;

      if (!latestMap.has(key)) {
        latestMap.set(key, item);
      } else {
        const oldItem = latestMap.get(key);
        if (new Date(item.created_at) > new Date(oldItem.created_at)) {
          latestMap.set(key, item);
        }
      }
    });

    const latestResults = Array.from(latestMap.values());

    // 5. студент бойынша топтау
    const statsMap = new Map();

    latestResults.forEach(item => {
      if (!statsMap.has(item.student_id)) {
        statsMap.set(item.student_id, {
          student_id: item.student_id,
          name: profileMap[item.student_id]?.name || "Аты жоқ",
          subject_name: item.subject_name,
          tests: [],
          last_date: item.created_at
        });
      }

      const current = statsMap.get(item.student_id);

      current.tests.push(item.percent);

      if (new Date(item.created_at) > new Date(current.last_date)) {
        current.last_date = item.created_at;
      }
    });

    const finalData = Array.from(statsMap.values()).map(student => {
      const average =
        student.tests.reduce((sum, value) => sum + Number(value || 0), 0) /
        (student.tests.length || 1);

      return {
        ...student,
        average: Number(average.toFixed(1)),
        test_count: student.tests.length,
        rating: getRatingLabel(average)
      };
    });

    finalData.sort((a, b) => b.average - a.average);

    renderResultsTable(finalData);
    resultsSubtitle.textContent = `Табылғаны: ${finalData.length} оқушы`;
  } catch (error) {
    console.error("Нәтижелерді жүктеу қатесі:", error);
    resultsSubtitle.textContent = "Қате пайда болды";
    resultsContainer.innerHTML = `<div class="empty-state">Қате пайда болды. Console-ды тексеріңіз.</div>`;
  }
}

function getRatingLabel(avg) {
  if (avg >= 90) return "Өте жақсы";
  if (avg >= 75) return "Жақсы";
  if (avg >= 50) return "Орташа";
  return "Төмен";
}

function getRatingClass(avg) {
  if (avg >= 90) return "excellent";
  if (avg >= 75) return "good";
  if (avg >= 50) return "medium";
  return "low";
}

function renderResultsTable(data) {
  if (!data.length) {
    resultsContainer.innerHTML = `<div class="empty-state">Нәтиже табылмады.</div>`;
    return;
  }

  const rows = data.map((item, index) => {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.subject_name || "—"}</td>
        <td>${item.test_count}</td>
        <td><strong>${item.average}%</strong></td>
        <td>
          <span class="rating-badge ${getRatingClass(item.average)}">
            ${item.rating}
          </span>
        </td>
        <td>${formatDateTime(item.last_date)}</td>
      </tr>
    `;
  }).join("");

  resultsContainer.innerHTML = `
    <div class="table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Оқушы</th>
            <th>Пән</th>
            <th>Тест саны</th>
            <th>Орташа нәтиже</th>
            <th>Рейтинг</th>
            <th>Соңғы тапсырған күні</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}