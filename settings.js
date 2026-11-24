// Gestione Tema Chiaro / Scuro
function applyTheme(theme) {
  const isLight = theme === "light";
  if (isLight) {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("wb_theme", theme);

  const btnDark = document.getElementById("btnThemeDark");
  const btnLight = document.getElementById("btnThemeLight");
  if (btnDark && btnLight) {
    btnDark.classList.toggle("active", !isLight);
    btnLight.classList.toggle("active", isLight);
  }
}

applyTheme(localStorage.getItem("wb_theme") || "dark");

document.getElementById("btnThemeDark").addEventListener("click", () => applyTheme("dark"));
document.getElementById("btnThemeLight").addEventListener("click", () => applyTheme("light"));

function syncSupportMailtoLink() {
  const linkEl = document.getElementById("btnContactSupportMail");
  if (!linkEl) return;

  const userName = currentProfile?.full_name || "Utente";
  const userRole = currentProfile?.role === "trainer" ? "Personal Trainer" : (currentProfile?.role === "athlete" ? "Atleta" : "Visitatore");
  const userEmail = currentUser?.email || currentProfile?.email || "";

  const subject = encodeURIComponent(`Segnalazione / Supporto Workout Builder - ${userName}`);
  const body = encodeURIComponent(
    `Ciao Team Workout Builder,\n\n` +
    `Utente: ${userName} (${userRole})\n` +
    (userEmail ? `Email account: ${userEmail}\n` : "") +
    `\nDescrivi qui il problema o la richiesta:\n`
  );

  linkEl.href = `mailto:info@workoutbuilder.it?subject=${subject}&body=${body}`;
}

// Apertura e chiusura pannello Impostazioni
document.getElementById("btnOpenSettings").addEventListener("click", () => {
  const panel = document.getElementById("settingsSection");
  panel.classList.toggle("hidden");
  document.getElementById("notificationsSection").classList.add("hidden");

  const profileNameBox = document.getElementById("profileNameSettingsBox");
  const inputFullName = document.getElementById("inputSettingsFullName");
  const appGuideBox = document.getElementById("appGuideSettingsBox");
  const trainerLogoBox = document.getElementById("trainerLogoSettingsBox");

  if (currentProfile) {
    if (profileNameBox) profileNameBox.classList.remove("hidden");
    if (inputFullName) inputFullName.value = currentProfile.full_name || "";
    if (appGuideBox) appGuideBox.classList.remove("hidden");
  } else {
    if (profileNameBox) profileNameBox.classList.add("hidden");
    if (appGuideBox) appGuideBox.classList.add("hidden");
  }

  if (currentProfile && currentProfile.role === "trainer") {
    trainerLogoBox.classList.remove("hidden");
    const preview = document.getElementById("settingsLogoPreview");
    preview.src = currentProfile.logo_url || "logo_W.jpeg";
    preview.style.display = "block";
  } else {
    trainerLogoBox.classList.add("hidden");
  }

  syncSupportMailtoLink();
});

document.getElementById("btnCloseSettings").addEventListener("click", () => {
  document.getElementById("settingsSection").classList.add("hidden");
  const guideBox = document.getElementById("appGuideSection");
  const guideBtn = document.getElementById("btnOpenAppGuide");
  if (guideBox) guideBox.classList.add("hidden");
  if (guideBtn) guideBtn.textContent = "📖 Apri Guida";
});

// Salvataggio modifica Nome e Cognome
const btnSaveProfileName = document.getElementById("btnSaveProfileName");
if (btnSaveProfileName) {
  btnSaveProfileName.addEventListener("click", async () => {
    if (!currentProfile) return;
    const inputEl = document.getElementById("inputSettingsFullName");
    const newName = inputEl ? inputEl.value.trim() : "";

    if (!newName || newName.length < 2) {
      alert("Inserisci un nome e cognome validi (almeno 2 caratteri).");
      return;
    }

    btnSaveProfileName.disabled = true;
    btnSaveProfileName.textContent = "Salvataggio...";

    const { error } = await supabaseClient
      .from("profiles")
      .update({ full_name: newName })
      .eq("id", currentProfile.id);

    btnSaveProfileName.disabled = false;
    btnSaveProfileName.textContent = "💾 Salva Nome";

    if (error) {
      alert("Errore aggiornamento nome: " + error.message);
      return;
    }

    currentProfile.full_name = newName;
    const roleBadge = document.getElementById("userRoleBadge");
    if (roleBadge) {
      roleBadge.textContent = currentProfile.role === "trainer"
        ? `Coach: ${newName}`
        : `Atleta: ${newName}`;
    }

    syncSupportMailtoLink();
    alert("✅ Nome aggiornato con successo!");
  });
}

// Aggiorna visivamente il logo in tutta l'app (Header + PDF)
function applyBrandLogo(logoUrl) {
  const src = logoUrl || "logo_W.jpeg";
  const headerLogo = document.getElementById("headerLogoImg");
  const pdfLogo = document.getElementById("pdfLogoImg");
  if (headerLogo) {
    headerLogo.src = src;
    headerLogo.style.display = "block";
  }
  if (pdfLogo) {
    pdfLogo.src = src;
    pdfLogo.style.display = "block";
  }
}

// Ridimensiona immagine lato browser prima del salvataggio
function resizeLogoImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 280;
        let width = img.width;
        let height = img.height;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Salvataggio logo personalizzato su Supabase
document.getElementById("btnSaveLogo").addEventListener("click", async () => {
  const fileInput = document.getElementById("inputLogoFile");
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Seleziona prima un'immagine dal dispositivo.");
    return;
  }

  const btn = document.getElementById("btnSaveLogo");
  btn.disabled = true;
  btn.textContent = "Caricamento...";

  try {
    const dataUrl = await resizeLogoImage(fileInput.files[0]);
    const { error } = await supabaseClient
      .from("profiles")
      .update({ logo_url: dataUrl })
      .eq("id", currentProfile.id);

    if (error) {
      alert("Errore salvataggio logo: " + error.message);
    } else {
      currentProfile.logo_url = dataUrl;
      applyBrandLogo(dataUrl);
      document.getElementById("settingsLogoPreview").src = dataUrl;
      fileInput.value = "";
      alert("Logo aggiornato con successo!");
    }
  } catch (err) {
    alert("Impossibile elaborare l'immagine selezionata.");
  }

  btn.disabled = false;
  btn.textContent = "💾 Salva Logo";
});

// Ripristino logo predefinito
document.getElementById("btnResetLogo").addEventListener("click", async () => {
  const { error } = await supabaseClient
    .from("profiles")
    .update({ logo_url: null })
    .eq("id", currentProfile.id);

  if (!error) {
    currentProfile.logo_url = null;
    applyBrandLogo(null);
    document.getElementById("settingsLogoPreview").src = "logo_W.jpeg";
    alert("Logo predefinito ripristinato.");
  }
});

// Guida Applicazione espandibile dentro Impostazioni
const btnOpenAppGuide = document.getElementById("btnOpenAppGuide");
const appGuideSection = document.getElementById("appGuideSection");
const appGuideContent = document.getElementById("appGuideContent");

function renderAppGuideContent() {
  if (!appGuideContent) return;
  const isTrainer = typeof currentProfile !== "undefined" && currentProfile && currentProfile.role === "trainer";

  if (isTrainer) {
    appGuideContent.innerHTML = `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">1. Collegare gli Atleti</strong>
        Copia il tuo <strong>Codice Invito</strong> dalla scheda <em>I Miei Atleti</em> e invialo al cliente. Una volta registrato come Atleta, potrà incollarlo per collegarsi al tuo profilo.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">2. Anamnesi Privata (Collegati ed Esterni)</strong>
        Clicca su <strong>🩺 Anamnesi</strong> accanto a un atleta collegato (oppure <strong>➕ Nuova Anamnesi</strong> per clienti esterni) per annotare infortuni, obiettivi, stile di vita e note riservate visibili solo a te.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">3. Workout Builder, Circuiti e PDF</strong>
        Seleziona l'atleta (o lascia vuoto per solo PDF), aggiungi gli esercizi per giorno, usa <em>Inizio/Fine Circuito</em> per raggruppare superset o circuiti, salva in <strong>📝 Bozza</strong> o invia direttamente all'app con <strong>☁️ Salva e Invia</strong>.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">4. Progressi, Check-in e Statistiche</strong>
        In <strong>📊 Progressi</strong> leggi carichi e note dell'atleta e rispondi sotto ogni esercizio. In <strong>✅ Check-in</strong> controlli i report settimanali e in <strong>📈 Statistiche</strong> monitori l'andamento nel tempo (anche quando l'atleta esegue la scheda senza modificare i parametri prescritti).
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">5. Notifiche Push sul Dispositivo</strong>
        Apri la campanella <strong>🔔</strong> in alto e tocca <strong>📲 Avvisi Device</strong> per ricevere avvisi istantanei sul telefono quando un atleta invia un check-in o aggiorna la scheda.
      </div>
    `;
  } else {
    appGuideContent.innerHTML = `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">1. Collegamento al Personal Trainer</strong>
        Al primo accesso incolla il <strong>Codice Invito</strong> ricevuto dal tuo coach per sincronizzare automaticamente il tuo profilo e ricevere le schede. Se hai sbagliato a scrivere il tuo nome in registrazione, puoi correggerlo qui sopra nelle <em>Impostazioni</em>.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">2. Modalità Allenamento vs Scheda Pulita</strong>
        In cima alla scheda puoi alternare <strong>✏️ Modalità Allenamento</strong> (per inserire Kg, Ripetizioni, RIR e note per ogni serie) e <strong>Scheda Pulita</strong> (per consultare solo gli esercizi). Se esegui esattamente ciò che ha indicato il coach, ti basta salvare l'allenamento senza dover riscrivere tutto.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">3. Check-in Settimanale e PDF</strong>
        Nella scheda <strong>✅ Check-in Settimanale</strong> puoi inviare ogni domenica peso corporeo, aderenza e feedback al coach. In fondo alla scheda di allenamento puoi sempre scaricare il <strong>📄 PDF</strong>.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">4. Notifiche Push sul Telefono</strong>
        Apri la campanella <strong>🔔</strong> in alto e tocca <strong>📲 Avvisi Device</strong> (su iPhone aggiungi prima l'app alla schermata Home) per ricevere avvisi quando il coach pubblica una nuova scheda o risponde ai tuoi commenti.
      </div>
    `;
  }
}

if (btnOpenAppGuide && appGuideSection) {
  btnOpenAppGuide.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = appGuideSection.classList.contains("hidden");
    if (isHidden) {
      renderAppGuideContent();
      appGuideSection.classList.remove("hidden");
      btnOpenAppGuide.textContent = "Chiudi ✖";
    } else {
      appGuideSection.classList.add("hidden");
      btnOpenAppGuide.textContent = "📖 Apri Guida";
    }
  });
}
