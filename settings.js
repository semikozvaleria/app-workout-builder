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
    setHeaderRoleBadge(currentProfile.role === "trainer" ? "Coach" : "Atleta", newName);

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

// Riquadro della guida in-app
function guideCard(title, bodyHtml) {
  return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">${title}</strong>
        ${bodyHtml}
      </div>`;
}

function renderAppGuideContent() {
  if (!appGuideContent) return;
  const isTrainer = typeof currentProfile !== "undefined" && currentProfile && currentProfile.role === "trainer";

  if (isTrainer) {
    appGuideContent.innerHTML = [
      guideCard("1. Collegare gli atleti",
        `Copia il tuo <strong>Codice Invito</strong> in <em>I Miei Atleti</em> e mandalo al cliente: dopo la registrazione come Atleta lo incolla e si collega al tuo profilo.`),
      guideCard("2. Aderenza settimanale",
        `In cima a <em>I Miei Atleti</em> vedi per ogni atleta le sedute di questa settimana rispetto a quelle previste dalla scheda, le ultime 4 settimane e quando si è allenato o ha fatto il check-in l'ultima volta. In alto trovi chi è <strong>fermo</strong> (rosso) o <strong>in ritardo</strong> (giallo); tocca il nome per aprire i suoi progressi.`),
      guideCard("3. Anamnesi privata",
        `Tocca <strong>🩺 Anamnesi</strong> su un atleta collegato, oppure <strong>➕ Nuova Anamnesi</strong> per un cliente esterno, per annotare obiettivi, infortuni, stile di vita e note riservate. Le vedi solo tu.`),
      guideCard("4. Crea/Modifica Scheda",
        `Scegli l'atleta (o lascia vuoto per il solo PDF) e la modalità: <strong>Classica</strong> (scheda unica) o <strong>Mesociclo</strong> (da 2 a 10 settimane). Aggiungi gli esercizi per giorno; con <em>Inizio/Fine Circuito</em> raggruppi superset e circuiti, con <strong>➕ Nuovo Esercizio</strong> crei esercizi tuoi con foto. Puoi salvare una <strong>📝 Bozza</strong>, ricaricare la scheda attuale o clonarne una dallo storico (<em>Schede → Carica nel Builder</em>), poi inviarla con <strong>Salva e Invia all'app dell'Atleta</strong> o scaricare il <strong>📄 PDF</strong>.`),
      guideCard("5. Progressione del mesociclo",
        `In modalità Mesociclo tocca <strong>📅 Programma per Settimana</strong> sotto un esercizio: per ogni settimana imposti serie/reps, recupero, RIR e una nota. Le scorciatoie fanno il resto: <em>Copia Sett. 1 su tutte</em>, <em>+1 rep/sett.</em>, <em>-1 RIR/sett.</em> e <em>Deload</em> (serie ridotte e RIR più alto sulla settimana scelta). Il PDF mostra le settimane in colonna.`),
      guideCard("6. Progressi e note",
        `In <strong>📊 Progressi</strong> leggi carichi, ripetizioni e note dell'atleta per ogni esercizio (con la settimana del mesociclo) e rispondi sotto con un messaggio.`),
      guideCard("7. Video dell'esecuzione",
        `Quando un atleta carica un video lo trovi in <em>Progressi</em> (<strong>DA REVISIONARE</strong>). Tocca <strong>Registra commento audio</strong>: il video parte e mentre parli puoi fermarlo, spostarti con la barra e <strong>disegnare</strong> sul fotogramma (mano libera, linea, freccia, cerchio, angolo con i gradi). Riascolta l'anteprima e premi <strong>Salva</strong>: l'atleta rivedrà video, voce e disegni sincronizzati. Puoi aggiungere anche una nota scritta.`),
      guideCard("8. Check-in settimanali",
        `In <strong>✅ Check-in</strong> leggi peso, aderenza, sonno, energia, stress e note. Se l'atleta le ha inserite vedi anche le <strong>misure corporee</strong> con la variazione rispetto al check-in precedente e le <strong>foto</strong> (tocca per ingrandire). Con <strong>Confronto foto</strong> metti due date una accanto all'altra, posa per posa, con le differenze di peso e misure. Scrivi il tuo feedback e premi <strong>💾 Salva Feedback</strong>.`),
      guideCard("9. Statistiche",
        `In <strong>📈 Statistiche</strong> trovi costanza, tonnellaggio, andamento del peso corporeo, carichi e 1RM stimato per esercizio, serie per gruppo muscolare e calendario delle sedute.`),
      guideCard("10. Impostazioni e notifiche",
        `Dall'ingranaggio cambi tema, nome e logo (comparirà anche nell'app dei tuoi atleti e nei PDF). Apri la campanella <strong>🔔</strong> e tocca <strong>📲 Avvisi Device</strong> per ricevere sul telefono gli avvisi di check-in, video e aggiornamenti delle schede.`)
    ].join("");
  } else {
    appGuideContent.innerHTML = [
      guideCard("1. Collegamento al tuo coach",
        `Al primo accesso incolla il <strong>Codice Invito</strong> ricevuto dal coach: il tuo profilo si collega e ricevi le schede. Se hai scritto male il nome puoi correggerlo nelle <em>Impostazioni</em>.`),
      guideCard("2. La tua scheda",
        `In cima scegli tra <strong>Modalità Allenamento</strong> (per segnare Kg, ripetizioni e RIR di ogni serie, più una nota) e <strong>Scheda Pulita</strong> (solo gli esercizi). Premi <strong>Salva</strong> dopo ogni esercizio: il coach vede subito i tuoi carichi.`),
      guideCard("3. Schede a settimane (mesociclo)",
        `Se il coach ha programmato più settimane, in alto trovi i pulsanti <em>Sett. 1, Sett. 2…</em>: la settimana <strong>● in corso</strong> è già selezionata e quelle di <strong>scarico</strong> sono evidenziate. In una settimana nuova vedi in grigio nei campi i carichi della settimana precedente, come riferimento.`),
      guideCard("4. Video dell'esecuzione",
        `Sotto ogni esercizio apri <strong>Aggiungi video esecuzione</strong>, scegli un video (massimo 30 secondi), scrivi una domanda per il coach e invialo. Quando il coach risponde tocca <strong>Guarda</strong> e poi <strong>Ascolta con video</strong>: il video si ferma e si sposta insieme alla sua voce, con linee, frecce e angoli disegnati nei punti chiave. I segnalini sulla barra indicano dove si ferma a spiegare; tocca la barra per riascoltare un punto.`),
      guideCard("5. Check-in settimanale",
        `In <strong>✅ Check-in Settimanale</strong> invia ogni settimana peso, aderenza, sonno, energia, stress e una nota. Se vuoi aggiungi le <strong>misure corporee</strong> (sempre nello stesso punto, al mattino e a digiuno) e le <strong>foto</strong> fronte, lato e retro (stessa luce e stessa posa): le vede solo il tuo coach. Sotto trovi lo storico con le sue risposte.`),
      guideCard("6. PDF della scheda",
        `In fondo alla scheda tocca <strong>📄 Scarica PDF</strong> per averla sempre con te, anche stampata.`),
      guideCard("7. Notifiche sul telefono",
        `Apri la campanella <strong>🔔</strong> e tocca <strong>📲 Avvisi Device</strong> per sapere quando il coach pubblica una nuova scheda o ti risponde. Su iPhone aggiungi prima l'app alla schermata Home (Condividi → Aggiungi alla schermata Home).`)
    ].join("");
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
