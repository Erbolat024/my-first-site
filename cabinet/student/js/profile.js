async function loadProfile() {
  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.href = "/pages/login.html";
    return;
  }

  const { data, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, name, phone, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile error:", profileError);
    alert(`Профильді жүктеу кезінде қате шықты: ${profileError.message}`);
    return;
  }

  if (!data) {
    alert("Профиль табылмады");
    return;
  }

  const name = data.name || "Қолданушы";
  const email = data.email || user.email || "—";
  const phone = data.phone || "—";
  const role = data.role === "student" ? "Оқушы" : (data.role || "—");
  const id = data.id || user.id || "—";

  const profileName = document.getElementById("profile-name");
  const profileRole = document.getElementById("profile-role");
  const profileAvatar = document.getElementById("profile-avatar");

  const infoName = document.getElementById("info-name");
  const infoEmail = document.getElementById("info-email");
  const infoPhone = document.getElementById("info-phone");
  const infoRole = document.getElementById("info-role");
  const infoId = document.getElementById("info-id");

  if (profileName) profileName.textContent = name;
  if (profileRole) profileRole.textContent = role;
  if (profileAvatar) profileAvatar.textContent = name.charAt(0).toUpperCase();

  if (infoName) infoName.textContent = name;
  if (infoEmail) infoEmail.textContent = email;
  if (infoPhone) infoPhone.textContent = phone;
  if (infoRole) infoRole.textContent = role;
  if (infoId) infoId.textContent = id;
}

document.addEventListener("DOMContentLoaded", loadProfile);