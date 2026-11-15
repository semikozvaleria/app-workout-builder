let isRegisterMode = false;

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const registerFields = document.getElementById("registerFields");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");
const authMessage = document.getElementById("authMessage");

function resetPasswordVisibility() {
  const pwdInput = document.getElementById("authPassword");
  const iconOpen = document.getElementById("iconEyeOpen");
  const iconClosed = document.getElementById("iconEyeClosed");
  if (pwdInput) pwdInput.type = "password";
  if (iconOpen) iconOpen.classList.remove("hidden");
  if (iconClosed) iconClosed.classList.add("hidden");
}

function resetUIOnSignOut() {
  currentProfile = null;
  resetPasswordVisibility();
  if (typeof applyBrandLogo === "function") applyBrandLogo(null);
  if (typeof updateTrainerLogoSettingsVisibility === "function") updateTrainerLogoSettingsVisibility();

  const deleteBox = document.getElementById("deleteAccountSettingsBox");
  if (deleteBox) deleteBox.classList.add("hidden");

  document.getElementById("settingsSection").classList.add("hidden");
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("trainerSection").classList.add("hidden");
  document.getElementById("athleteSection").classList.add("hidden");
  document.getElementById("btnLogout").classList.add("hidden");
  document.getElementById("btnOpenNotifications").classList.add("hidden");
  document.getElementById("notifCountBadge").classList.add("hidden");
  document.getElementById("notificationsSection").classList.add("hidden");
  document.getElementById("userRoleBadge").textContent = "Cloud Coaching System";
}

document.getElementById("btnTogglePassword").addEventListener("click", () => {
  const pwdInput = document.getElementById("authPassword");
  const iconOpen = document.getElementById("iconEyeOpen");
  const iconClosed = document.getElementById("iconEyeClosed");
  const isHidden = pwdInput.type === "password";

  pwdInput.type = isHidden ? "text" : "password";
  iconOpen.classList.toggle("hidden", isHidden);
  iconClosed.classList.toggle("hidden", !isHidden);
});

tabLogin.addEventListener("click", () => {
  isRegisterMode = false;
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  registerFields.classList.add("hidden");
  btnAuthSubmit.textContent = "Accedi all'App";
  authMessage.textContent = "";
  resetPasswordVisibility();
});

tabRegister.addEventListener("click", () => {
  isRegisterMode = true;
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerFields.classList.remove("hidden");
  btnAuthSubmit.textContent = "Crea Account";
  authMessage.textContent = "";
  resetPasswordVisibility();
});

btnAuthSubmit.addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  authMessage.style.color = "var(--danger)";
  authMessage.textContent = "";

  if (!email || password.length < 6) {
    authMessage.textContent = "Inserisci un'email valida e una password di almeno 6 caratteri.";
    return;
  }

  btnAuthSubmit.disabled = true;
  btnAuthSubmit.textContent = "Attendere...";

  if (isRegisterMode) {
    const fullName = document.getElementById("authName").value.trim();
    const role = document.getElementById("authRole").value;
    if (!fullName) {
      authMessage.textContent = "Inserisci il tuo Nome e Cognome.";
      btnAuthSubmit.disabled = false;
      btnAuthSubmit.textContent = "Crea Account";
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      authMessage.textContent = error.message;
      btnAuthSubmit.disabled = false;
      btnAuthSubmit.textContent = "Crea Account";
      return;
    }

    if (data.user) {
      await supabaseClient.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: role
      }, { onConflict: 'id' });

      if (data.session) {
        await checkSession();
      } else {
        authMessage.style.color = "var(--success)";
        authMessage.textContent = "Account creato! Controlla l'email per confermare oppure accedi ora.";
      }
    }
  } else {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      authMessage.textContent = "Credenziali non valide: " + error.message;
    } else {
      await checkSession();
    }
  }

  btnAuthSubmit.disabled = false;
  btnAuthSubmit.textContent = isRegisterMode ? "Crea Account" : "Accedi all'App";
});

document.getElementById("btnLogout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  resetUIOnSignOut();
});

// Eliminazione definitiva account (Atleta o Coach) con doppia conferma
document.getElementById("btnDeleteAccount").addEventListener("click", async () => {
  if (!currentProfile) return;

  const isTrainer = currentProfile.role === 'trainer';
  const warningMsg = isTrainer
    ? "⚠️ ATTENZIONE: Stai per eliminare definitivamente il tuo account Personal Trainer.\n\nVerranno cancellati in modo irreversibile:\n- Il tuo profilo e il tuo logo\n- Tutte le schede e le bozze create\n- Il collegamento con i tuoi atleti\n\nVuoi procedere?"
    : "⚠️ ATTENZIONE: Stai per eliminare definitivamente il tuo account Atleta.\n\nVerranno cancellati in modo irreversibile:\n- Il tuo profilo\n- Tutte le tue schede e lo storico dei carichi\n\nVuoi procedere?";

  if (!confirm(warningMsg)) return;

  const typed = prompt('Per confermare definitivamente, scrivi ELIMINA in maiuscolo:');
  if (typed !== "ELIMINA") {
    alert("Eliminazione annullata.");
    return;
  }

  const btn = document.getElementById("btnDeleteAccount");
  btn.disabled = true;
  btn.textContent = "Eliminazione...";

  const { error } = await supabaseClient.rpc('delete_own_account');

  btn.disabled = false;
  btn.textContent = "🗑️ Elimina Account";

  if (error) {
    alert("Errore durante l'eliminazione dell'account: " + error.message);
    return;
  }

  await supabaseClient.auth.signOut().catch(() => {});
  resetUIOnSignOut();
  alert("✅ Il tuo account e tutti i dati associati sono stati eliminati definitivamente.");
});

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return;
  currentProfile = profile;
  resetPasswordVisibility();

  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("btnLogout").classList.remove("hidden");
  document.getElementById("btnOpenNotifications").classList.remove("hidden");

  const deleteBox = document.getElementById("deleteAccountSettingsBox");
  if (deleteBox) deleteBox.classList.remove("hidden");

  if (typeof updateTrainerLogoSettingsVisibility === "function") {
    updateTrainerLogoSettingsVisibility();
  }

  if (profile.role === 'trainer') {
    document.getElementById("userRoleBadge").textContent = `Coach: ${profile.full_name}`;
    document.getElementById("trainerSection").classList.remove("hidden");
    document.getElementById("athleteSection").classList.add("hidden");
    if (typeof applyBrandLogo === "function") applyBrandLogo(profile.logo_url);
    initTrainerArea();
  } else {
    document.getElementById("userRoleBadge").textContent = `Atleta: ${profile.full_name}`;
    document.getElementById("athleteSection").classList.remove("hidden");
    document.getElementById("trainerSection").classList.add("hidden");
    initAthleteArea();
  }
}
