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

// Applica subito il tema salvato all'apertura della pagina
applyTheme(localStorage.getItem("wb_theme") || "dark");

document.getElementById("btnThemeDark").addEventListener("click", () => applyTheme("dark"));
document.getElementById("btnThemeLight").addEventListener("click", () => applyTheme("light"));

// Apertura e chiusura pannello Impostazioni
document.getElementById("btnOpenSettings").addEventListener("click", () => {
  const panel = document.getElementById("settingsSection");
  panel.classList.toggle("hidden");

  // Mostra la sezione Logo solo se l'utente loggato è un Personal Trainer
  const trainerLogoBox = document.getElementById("trainerLogoSettingsBox");
  if (currentProfile && currentProfile.role === "trainer") {
    trainerLogoBox.classList.remove("hidden");
    const preview = document.getElementById("settingsLogoPreview");
    preview.src = currentProfile.logo_url || "logo_carlo.png";
    preview.style.display = "block";
  } else {
    trainerLogoBox.classList.add("hidden");
  }
});

document.getElementById("btnCloseSettings").addEventListener("click", () => {
  document.getElementById("settingsSection").classList.add("hidden");
});

// Aggiorna visivamente il logo in tutta l'app (Header + PDF)
function applyBrandLogo(logoUrl) {
  const src = logoUrl || "logo_carlo.png";
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

// Ridimensiona immagine lato browser prima del salvataggio (max 280px, leggera e nitida)
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
    document.getElementById("settingsLogoPreview").src = "logo_carlo.png";
    alert("Logo predefinito ripristinato.");
  }
});
