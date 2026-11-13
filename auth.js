currentProfile = null;

// Gestione dei Tab (Accedi / Registrati)
document.getElementById("tabLogin").addEventListener("click", () => {
  document.getElementById("tabLogin").classList.add("active");
  document.getElementById("tabRegister").classList.remove("active");
  document.getElementById("registerFields").classList.add("hidden");
  document.getElementById("btnAuthSubmit").textContent = "Accedi all'App";
  document.getElementById("authMessage").textContent = "";
});

document.getElementById("tabRegister").addEventListener("click", () => {
  document.getElementById("tabRegister").classList.add("active");
  document.getElementById("tabLogin").classList.remove("active");
  document.getElementById("registerFields").classList.remove("hidden");
  document.getElementById("btnAuthSubmit").textContent = "Registrati Ora";
  document.getElementById("authMessage").textContent = "";
});

// Invio Form di Autenticazione (Accedi / Registrati)
document.getElementById("btnAuthSubmit").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const isRegister = document.getElementById("tabRegister").classList.contains("active");
  const msgEl = document.getElementById("authMessage");
  const submitBtn = document.getElementById("btnAuthSubmit");

  if (!email || !password) {
    msgEl.style.color = "var(--danger)";
    msgEl.textContent = "Compila tutti i campi obbligatori.";
    return;
  }

  submitBtn.disabled = true;
  msgEl.style.color = "var(--text-muted)";
  msgEl.textContent = "Elaborazione in corso...";

  if (isRegister) {
    // REGISTRAZIONE NUOVO UTENTE
    const fullName = document.getElementById("authName").value.trim();
    const role = document.getElementById("authRole").value;

    if (!fullName) {
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = "Inserisci il tuo nome e cognome.";
      submitBtn.disabled = false;
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: role } }
    });

    if (error) {
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = "Errore registrazione: " + error.message;
      submitBtn.disabled = false;
      return;
    }

    if (data.user) {
      // Usa upsert per aggiornare il profilo anche se creato automaticamente da un trigger Supabase
      const { error: pError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
          logo_url: null
        }, { onConflict: 'id' });

      if (pError) {
        msgEl.style.color = "var(--danger)";
        msgEl.textContent = "Profilo registrato ma errore database: " + pError.message;
        submitBtn.disabled = false;
      } else {
        msgEl.style.color = "var(--success)";
        msgEl.textContent = "Registrazione completata! Accesso in corso...";
        submitBtn.disabled = false;
        setTimeout(() => checkSession(), 600);
      }
    } else {
      submitBtn.disabled = false;
    }
  } else {
    // ACCESSO UTENTE ESISTENTE
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    if (error) {
      msgEl.style.color = "var(--danger)";
      msgEl.textContent = "Credenziali non valide: " + error.message;
    } else {
      msgEl.textContent = "";
      checkSession();
    }
  }
});

// Logout Utente
document.getElementById("btnLogout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  currentProfile = null;

  document.getElementById("btnOpenNotifications").classList.add("hidden");
  document.getElementById("notifCountBadge").classList.add("hidden");
  document.getElementById("notificationsSection").classList.add("hidden");
  document.getElementById("settingsSection").classList.add("hidden");

  checkSession();
});

// Controllo Sessione attiva
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    // Utente NON loggato: mostra login e nasconde aree private e campanella
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("trainerSection").classList.add("hidden");
    document.getElementById("athleteSection").classList.add("hidden");

    document.getElementById("btnOpenNotifications").classList.add("hidden");
    document.getElementById("notifCountBadge").classList.add("hidden");
    document.getElementById("btnLogout").classList.add("hidden");
    document.getElementById("userRoleBadge").textContent = "Cloud Coaching System";

    applyBrandLogo(null);
    return;
  }

  // Utente loggato: recupera il profilo dal database
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    await supabaseClient.auth.signOut();
    checkSession();
    return;
  }

  currentProfile = profile;

  // Mostra campanella e logout
  document.getElementById("btnOpenNotifications").classList.remove("hidden");
  document.getElementById("btnLogout").classList.remove("hidden");
  document.getElementById("authSection").classList.add("hidden");

  applyBrandLogo(profile.logo_url);

  // Reindirizzamento in base al ruolo
  if (profile.role === 'trainer') {
    document.getElementById("trainerSection").classList.remove("hidden");
    document.getElementById("athleteSection").classList.add("hidden");
    document.getElementById("userRoleBadge").textContent = "Personal Trainer";
    await initTrainerArea();
  } else {
    document.getElementById("trainerSection").classList.add("hidden");
    document.getElementById("athleteSection").classList.remove("hidden");
    document.getElementById("userRoleBadge").textContent = "Atleta";
    await initAthleteArea();
  }
}
