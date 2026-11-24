let isRegisterMode = false;
let isPasswordRecoveryFlow = false;

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const registerFields = document.getElementById("registerFields");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");
const authMessage = document.getElementById("authMessage");
const btnForgotPassword = document.getElementById("btnForgotPassword");

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
  if (typeof trainerClients !== "undefined") trainerClients = [];
  if (typeof trainerAnamnesisList !== "undefined") trainerAnamnesisList = [];
  if (typeof currentWorkout !== "undefined") currentWorkout = [];
  if (typeof currentDraftId !== "undefined") currentDraftId = null;
  if (typeof editingItemUid !== "undefined") editingItemUid = null;
  if (typeof currentAthleteWorkoutData !== "undefined") currentAthleteWorkoutData = null;

  resetPasswordVisibility();
  if (typeof applyBrandLogo === "function") applyBrandLogo(null);
  if (typeof updateTrainerLogoSettingsVisibility === "function") updateTrainerLogoSettingsVisibility();

  const deleteBox = document.getElementById("deleteAccountSettingsBox");
  if (deleteBox) deleteBox.classList.add("hidden");

  const profileNameBox = document.getElementById("profileNameSettingsBox");
  if (profileNameBox) profileNameBox.classList.add("hidden");

  const appGuideBox = document.getElementById("appGuideSettingsBox");
  if (appGuideBox) appGuideBox.classList.add("hidden");

  document.getElementById("settingsSection").classList.add("hidden");
  document.getElementById("resetPasswordSection").classList.add("hidden");
  document.getElementById("authSection").classList.remove("hidden");
  document.getElementById("trainerSection").classList.add("hidden");
  document.getElementById("athleteSection").classList.add("hidden");
  document.getElementById("btnLogout").classList.add("hidden");
  document.getElementById("btnOpenNotifications").classList.add("hidden");
  document.getElementById("notifCountBadge").classList.add("hidden");
  document.getElementById("notificationsSection").classList.add("hidden");
  document.getElementById("userRoleBadge").textContent = "Cloud Coaching System";
}

function showPasswordRecoveryScreen() {
  isPasswordRecoveryFlow = true;
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("trainerSection").classList.add("hidden");
  document.getElementById("athleteSection").classList.add("hidden");
  document.getElementById("resetPasswordSection").classList.remove("hidden");
  const msg = document.getElementById("resetPasswordMessage");
  if (msg) msg.textContent = "";
}

// Intercetta l'evento PASSWORD_RECOVERY quando l'utente apre il link ricevuto via email
supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    showPasswordRecoveryScreen();
  }
});

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
  if (btnForgotPassword) btnForgotPassword.classList.remove("hidden");
  btnAuthSubmit.textContent = "Accedi all'App";
  authMessage.textContent = "";
  resetPasswordVisibility();
});

tabRegister.addEventListener("click", () => {
  isRegisterMode = true;
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerFields.classList.remove("hidden");
  if (btnForgotPassword) btnForgotPassword.classList.add("hidden");
  btnAuthSubmit.textContent = "Crea Account";
  authMessage.textContent = "";
  resetPasswordVisibility();
});

// Invio email per reimpostare la password
if (btnForgotPassword) {
  btnForgotPassword.addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();
    authMessage.style.color = "var(--danger)";
    authMessage.textContent = "";

    if (!email || !email.includes("@")) {
      authMessage.textContent = "Inserisci prima la tua email nel campo qui sopra, poi clicca su 'Password dimenticata?'.";
      document.getElementById("authEmail").focus();
      return;
    }

    btnForgotPassword.disabled = true;
    const oldText = btnForgotPassword.textContent;
    btnForgotPassword.textContent = "Invio in corso...";

    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    btnForgotPassword.disabled = false;
    btnForgotPassword.textContent = oldText;

    if (error) {
      authMessage.textContent = "Errore invio email: " + error.message;
      return;
    }

    authMessage.style.color = "var(--success)";
    authMessage.textContent = "Email inviata! Controlla la tua casella di posta (anche Spam) e clicca sul link per impostare la nuova password.";
  });
}

// Salvataggio nuova password dal pannello di recupero
document.getElementById("btnSaveNewPassword").addEventListener("click", async () => {
  const newPwd = document.getElementById("newRecoveryPassword").value.trim();
  const confirmPwd = document.getElementById("confirmRecoveryPassword").value.trim();
  const msgEl = document.getElementById("resetPasswordMessage");
  const btn = document.getElementById("btnSaveNewPassword");

  msgEl.style.color = "var(--danger)";
  msgEl.textContent = "";

  if (newPwd.length < 6) {
    msgEl.textContent = "La nuova password deve contenere almeno 6 caratteri.";
    return;
  }
  if (newPwd !== confirmPwd) {
    msgEl.textContent = "Le due password non coincidono.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Salvataggio...";

  const { error } = await supabaseClient.auth.updateUser({ password: newPwd });

  btn.disabled = false;
  btn.textContent = "💾 Salva Nuova Password";

  if (error) {
    msgEl.textContent = "Errore durante l'aggiornamento: " + error.message;
    return;
  }

  isPasswordRecoveryFlow = false;
  document.getElementById("newRecoveryPassword").value = "";
  document.getElementById("confirmRecoveryPassword").value = "";
  document.getElementById("resetPasswordSection").classList.add("hidden");

  if (window.location.hash && window.location.hash.includes("type=recovery")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  alert("✅ Password aggiornata con successo! Ora puoi usare l'app.");
  await checkSession();
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

    const redirectUrl = `${window.location.origin}${window.location.pathname}`;

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

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
        authMessage.textContent = "Account creato! Controlla l'email e clicca sul link di conferma per accedere.";
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
  const btn = document.getElementById("btnLogout");
  btn.disabled = true;
  btn.textContent = "Uscita...";

  await supabaseClient.auth.signOut().catch(() => {});
  resetUIOnSignOut();
  window.location.reload();
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
  window.location.reload();
});

async function checkSession() {
  // Se l'URL contiene il token di recupero password, mostra prima il modulo nuova password
  if (window.location.hash && window.location.hash.includes("type=recovery")) {
    showPasswordRecoveryScreen();
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session || isPasswordRecoveryFlow) return;

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return;
  currentProfile = profile;
  resetPasswordVisibility();

  if (typeof loadExercisesFromCloud === "function") {
    await loadExercisesFromCloud();
  }

  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("resetPasswordSection").classList.add("hidden");
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
