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

// Apertura e chiusura pannello Impostazioni
document.getElementById("btnOpenSettings").addEventListener("click", () => {
  const panel = document.getElementById("settingsSection");
  panel.classList.toggle("hidden");
  document.getElementById("notificationsSection").classList.add("hidden");

  const trainerLogoBox = document.getElementById("trainerLogoSettingsBox");
  if (currentProfile && currentProfile.role === "trainer") {
    trainerLogoBox.classList.remove("hidden");
    const preview = document.getElementById("settingsLogoPreview");
    preview.src = currentProfile.logo_url || "logo_W.jpeg";
    preview.style.display = "block";
  } else {
    trainerLogoBox.classList.add("hidden");
  }
});

document.getElementById("btnCloseSettings").addEventListener("click", () => {
  document.getElementById("settingsSection").classList.add("hidden");
  const guideBox = document.getElementById("appGuideSection");
  const guideBtn = document.getElementById("btnOpenAppGuide");
  if (guideBox) guideBox.classList.add("hidden");
  if (guideBtn) guideBtn.textContent = "📖 Apri Guida";
});

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
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">4. Progressi, Risposte e Statistiche</strong>
        In <strong>📊 Progressi</strong> leggi i carichi e le note inserite dall'atleta e rispondi direttamente sotto ogni esercizio. In <strong>📈 Statistiche</strong> monitori l'andamento di volumi e carichi nel tempo.
      </div>
    `;
  } else {
    appGuideContent.innerHTML = `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">1. Collegamento al Personal Trainer</strong>
        Al primo accesso incolla il <strong>Codice Invito</strong> ricevuto dal tuo coach per sincronizzare automaticamente il tuo profilo e ricevere le schede.
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">2. Modalità Allenamento vs Scheda Pulita</strong>
        In cima alla scheda puoi alternare <strong>✏️ Modalità Allenamento</strong> (per inserire Kg, Ripetizioni, RIR e note per ogni serie) e <strong>👁️ Scheda Pulita</strong> (per consultare solo gli esercizi senza campi di inserimento).
      </div>
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px;">
        <strong style="color: var(--primary); display: block; margin-bottom: 4px;">3. Feedback con il Coach e PDF</strong>
        Ogni volta che salvi i carichi o una nota, il tuo coach riceve una notifica e può risponderti direttamente sotto l'esercizio. In fondo alla pagina puoi sempre scaricare la scheda in <strong>📄 PDF</strong>.
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
