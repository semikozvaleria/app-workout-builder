//Gestisce Login, Registrazione, Logout e il riconoscimento del ruolo (Coach o Atleta).

let isRegisterMode = false;

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const registerFields = document.getElementById("registerFields");
const btnAuthSubmit = document.getElementById("btnAuthSubmit");
const authMessage = document.getElementById("authMessage");

tabLogin.addEventListener("click", () => {
  isRegisterMode = false;
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  registerFields.classList.add("hidden");
  btnAuthSubmit.textContent = "Accedi all'App";
  authMessage.textContent = "";
});

tabRegister.addEventListener("click", () => {
  isRegisterMode = true;
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerFields.classList.remove("hidden");
  btnAuthSubmit.textContent = "Crea Account";
  authMessage.textContent = "";
});

btnAuthSubmit.addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  authMessage.textContent = "";

  if (!email || !password) {
    authMessage.textContent = "Inserisci email e password.";
    return;
  }

  btnAuthSubmit.disabled = true;
  btnAuthSubmit.textContent = "Attendere...";

  if (isRegisterMode) {
    const fullName = document.getElementById("authName").value.trim();
    const role = document.getElementById("authRole").value;
    if (!fullName) {
      authMessage.textContent = "Inserisci Nome e Cognome.";
      btnAuthSubmit.disabled = false;
      btnAuthSubmit.textContent = "Crea Account";
      return;
    }

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: role } }
    });

    if (error) {
      authMessage.textContent = "Errore registrazione: " + error.message;
    } else {
      await checkSession();
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
  location.reload();
});

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("trainerSection").classList.add("hidden");
    document.getElementById("athleteSection").classList.add("hidden");
    document.getElementById("btnLogout").classList.add("hidden");
    return;
  }

  currentUser = session.user;
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !profile) {
    authMessage.textContent = "Profilo non trovato. Riprova tra qualche secondo.";
    return;
  }

  currentProfile = profile;
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("btnLogout").classList.remove("hidden");

  if (profile.role === 'trainer') {
    document.getElementById("userRoleBadge").textContent = `Coach: ${profile.full_name}`;
    document.getElementById("trainerSection").classList.remove("hidden");
    initTrainerArea();
  } else {
    document.getElementById("userRoleBadge").textContent = `Atleta: ${profile.full_name}`;
    document.getElementById("athleteSection").classList.remove("hidden");
    initAthleteArea();
  }
}
