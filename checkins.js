// =========================================================
// MODULO CHECK-IN DI FINE SETTIMANA (ATLETA -> COACH)
// =========================================================

function escapeCheckinHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- MISURE E FOTO DEI PROGRESSI (FACOLTATIVE) ---
const PROGRESS_PHOTO_BUCKET = "progress-photos";
const CHECKIN_MEASURES = [
  { key: "waist", label: "Vita", inputId: "checkinMeasureWaist" },
  { key: "hips", label: "Fianchi", inputId: "checkinMeasureHips" },
  { key: "chest", label: "Petto", inputId: "checkinMeasureChest" },
  { key: "arm", label: "Braccio", inputId: "checkinMeasureArm" },
  { key: "thigh", label: "Coscia", inputId: "checkinMeasureThigh" },
  { key: "calf", label: "Polpaccio", inputId: "checkinMeasureCalf" }
];
const CHECKIN_PHOTO_POSES = [
  { key: "front", label: "Fronte", inputId: "checkinPhotoFront" },
  { key: "side", label: "Lato", inputId: "checkinPhotoSide" },
  { key: "back", label: "Retro", inputId: "checkinPhotoBack" }
];
const progressPhotoUrlCache = new Map();

function formatCm(v) {
  const n = Number(v);
  return Number.isFinite(n) ? `${String(Math.round(n * 10) / 10).replace(".", ",")} cm` : "-";
}

function hasAnyCheckinPhoto(item) {
  return Boolean(item && item.photo_paths && CHECKIN_PHOTO_POSES.some(p => item.photo_paths[p.key]));
}

// Ridimensiona la foto (lato lungo 1600 px, JPEG 0,85): nitida ma leggera
async function resizeProgressPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Formato immagine non supportato. Usa una foto JPG o PNG."));
      el.src = url;
    });
    const maxSide = 1600;
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("Impossibile elaborare la foto.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function getProgressPhotoUrl(path) {
  if (!path) return null;
  const cached = progressPhotoUrlCache.get(path);
  if (cached && cached.exp > Date.now()) return cached.url;
  const { data, error } = await supabaseClient.storage.from(PROGRESS_PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error || !data || !data.signedUrl) return null;
  progressPhotoUrlCache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

// Carica le immagini con data-photo-path dentro root (URL firmati temporanei)
async function hydrateProgressPhotos(root) {
  if (!root) return;
  const imgs = Array.from(root.querySelectorAll("img[data-photo-path]"));
  await Promise.all(imgs.map(async (img) => {
    const url = await getProgressPhotoUrl(img.dataset.photoPath);
    if (url) img.src = url;
    else img.closest(".checkin-thumb")?.classList.add("missing");
  }));
}

function buildCheckinPhotoThumbsHtml(item) {
  if (!hasAnyCheckinPhoto(item)) return "";
  return `<div class="checkin-thumbs">${CHECKIN_PHOTO_POSES.filter(p => item.photo_paths[p.key]).map(p => `
    <button type="button" class="checkin-thumb" onclick="openProgressPhotoViewer(this)" title="${p.label}">
      <img data-photo-path="${escapeCheckinHtml(item.photo_paths[p.key])}" alt="${p.label}">
      <span>${p.label}</span>
    </button>`).join("")}</div>`;
}

// Misure con variazione rispetto a un check-in precedente (facoltativo)
function buildCheckinMeasuresHtml(item, prevMeasures) {
  const m = item && item.measurements;
  if (!m) return "";
  const chips = CHECKIN_MEASURES.filter(f => m[f.key] != null).map(f => {
    let delta = "";
    if (prevMeasures && prevMeasures[f.key] != null) {
      const d = Math.round((Number(m[f.key]) - Number(prevMeasures[f.key])) * 10) / 10;
      if (d !== 0) delta = ` <em class="${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${String(d).replace(".", ",")}</em>`;
    }
    return `<span class="checkin-measure-chip">${f.label} <strong>${formatCm(m[f.key])}</strong>${delta}</span>`;
  });
  return chips.length ? `<div class="checkin-measures">${chips.join("")}</div>` : "";
}

// Visualizzatore a tutto schermo per una foto
function openProgressPhotoViewer(btn) {
  const img = btn && btn.querySelector("img");
  if (!img || !img.src) return;
  const overlay = document.createElement("div");
  overlay.className = "photo-viewer";
  overlay.innerHTML = `<img src="${img.src}" alt=""><span class="photo-viewer-label">${escapeCheckinHtml(btn.title || "")}</span><button type="button" class="photo-viewer-close" aria-label="Chiudi">✕</button>`;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
}

function formatCheckinDateIt(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getThirtyDaysAgoDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --- INIZIALIZZAZIONE TAB ATLETA ---
function initAthleteCheckinTabs() {
  const navTabs = document.getElementById("athleteNavTabs");
  const btnWorkout = document.getElementById("navAthleteWorkout");
  const btnCheckin = document.getElementById("navAthleteCheckin");
  const workoutCard = document.getElementById("athleteWorkoutCard");
  const checkinCard = document.getElementById("athleteCheckinCard");
  const dateInput = document.getElementById("checkinDate");

  if (!navTabs || !btnWorkout || !btnCheckin) return;

  if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.role === "athlete" && currentProfile.trainer_id) {
    navTabs.classList.remove("hidden");
  } else {
    navTabs.classList.add("hidden");
    return;
  }

  if (dateInput && !dateInput.value) {
    dateInput.value = toLocalDateKey(new Date());
  }

  btnWorkout.onclick = () => {
    btnWorkout.classList.replace("btn-outline", "btn-primary");
    btnCheckin.classList.replace("btn-primary", "btn-outline");
    if (checkinCard) checkinCard.classList.add("hidden");
    if (workoutCard) workoutCard.classList.remove("hidden");
  };

  btnCheckin.onclick = () => {
    btnCheckin.classList.replace("btn-outline", "btn-primary");
    btnWorkout.classList.replace("btn-primary", "btn-outline");
    if (workoutCard) workoutCard.classList.add("hidden");
    if (checkinCard) checkinCard.classList.remove("hidden");
    loadAthleteCheckinsHistory();
  };
}

// Anteprima delle foto scelte nel modulo check-in
CHECKIN_PHOTO_POSES.forEach((pose) => {
  const input = document.getElementById(pose.inputId);
  const preview = document.getElementById(`${pose.inputId}Preview`);
  if (!input || !preview) return;
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
    if (!file) {
      preview.innerHTML = `<span>+ ${pose.label}</span>`;
      preview.classList.remove("has-photo");
      return;
    }
    const url = URL.createObjectURL(file);
    preview.dataset.url = url;
    preview.classList.add("has-photo");
    preview.innerHTML = `<img src="${url}" alt="${pose.label}"><span>${pose.label}</span>`;
  });
});

function resetCheckinExtras() {
  CHECKIN_MEASURES.forEach((f) => { const el = document.getElementById(f.inputId); if (el) el.value = ""; });
  CHECKIN_PHOTO_POSES.forEach((pose) => {
    const input = document.getElementById(pose.inputId);
    const preview = document.getElementById(`${pose.inputId}Preview`);
    if (input) input.value = "";
    if (preview) {
      if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
      preview.classList.remove("has-photo");
      preview.innerHTML = `<span>+ ${pose.label}</span>`;
    }
  });
  ["checkinMeasuresBox", "checkinPhotosBox"].forEach((id) => { const d = document.getElementById(id); if (d) d.open = false; });
}

// --- CARICAMENTO STORICO ATLETA (ULTIMI 30 GIORNI) ---
async function loadAthleteCheckinsHistory() {
  const container = document.getElementById("athleteCheckinsHistoryContainer");
  if (!container || !currentProfile) return;

  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Caricamento storico...</div>`;

  const cutoffDate = getThirtyDaysAgoDateStr();

  const { data, error } = await supabaseClient
    .from("weekly_checkins")
    .select("*")
    .eq("athlete_id", currentProfile.id)
    .gte("checkin_date", cutoffDate)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.82rem;">Errore caricamento: ${escapeCheckinHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Nessun check-in inviato negli ultimi 30 giorni.</div>`;
    return;
  }

  container.innerHTML = data.map((item) => {
    const weightTxt = item.weight_kg !== null && item.weight_kg !== undefined ? `<strong>${item.weight_kg} kg</strong>` : "Peso n/d";
    const coachReplyHtml = item.coach_feedback
      ? `<div style="margin-top: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(14, 165, 233, 0.12); border-left: 3px solid var(--primary); font-size: 0.8rem;">
           <strong>Risposta Coach:</strong> ${escapeCheckinHtml(item.coach_feedback)}
         </div>`
      : `<div style="margin-top: 6px; font-size: 0.75rem; color: var(--text-muted);">In attesa di revisione del coach</div>`;

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 0.84rem; color: var(--primary);">📅 ${formatCheckinDateIt(item.checkin_date)}</strong>
          <span style="font-size: 0.84rem;">⚖️ ${weightTxt}</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 6px;">
          <span>Aderenza: <strong>${item.adherence_score ?? "-"}/5</strong></span>
          <span>• Sonno: <strong>${item.sleep_score ?? "-"}/5</strong></span>
          <span>• Energia: <strong>${item.energy_score ?? "-"}/5</strong></span>
          <span>• Stress/Dolori: <strong>${item.stress_score ?? "-"}/5</strong></span>
        </div>
        ${buildCheckinMeasuresHtml(item, null)}
        ${buildCheckinPhotoThumbsHtml(item)}
        ${item.athlete_notes ? `<div style="font-size: 0.82rem; white-space: pre-wrap;">${escapeCheckinHtml(item.athlete_notes)}</div>` : ""}
        ${coachReplyHtml}
      </div>
    `;
  }).join("");
  hydrateProgressPhotos(container);
}

// --- INVIO NUOVO CHECK-IN (ATLETA) ---
const btnSubmitWeeklyCheckin = document.getElementById("btnSubmitWeeklyCheckin");
if (btnSubmitWeeklyCheckin) {
  btnSubmitWeeklyCheckin.addEventListener("click", async () => {
    if (!currentProfile || !currentProfile.trainer_id) {
      alert("Devi prima collegarti a un Personal Trainer per inviare il check-in.");
      return;
    }

    const checkinDate = document.getElementById("checkinDate").value || toLocalDateKey(new Date());
    const weightRaw = document.getElementById("checkinWeightKg").value;
    const weightKg = weightRaw !== "" ? parseFloat(weightRaw) : null;
    const adherence = parseInt(document.getElementById("checkinAdherence").value, 10);
    const sleep = parseInt(document.getElementById("checkinSleep").value, 10);
    const energy = parseInt(document.getElementById("checkinEnergy").value, 10);
    const stress = parseInt(document.getElementById("checkinStress").value, 10);
    const notes = document.getElementById("checkinAthleteNotes").value.trim();

    // Misure facoltative (solo i campi compilati)
    const measurements = {};
    CHECKIN_MEASURES.forEach((f) => {
      const raw = (document.getElementById(f.inputId) || {}).value;
      const n = raw !== undefined && raw !== "" ? parseFloat(String(raw).replace(",", ".")) : NaN;
      if (Number.isFinite(n) && n > 0) measurements[f.key] = Math.round(n * 10) / 10;
    });
    const hasMeasures = Object.keys(measurements).length > 0;

    // Foto facoltative
    const photoFiles = CHECKIN_PHOTO_POSES
      .map((p) => ({ pose: p, file: (document.getElementById(p.inputId) || {}).files?.[0] || null }))
      .filter((x) => x.file);

    if (weightKg === null && !notes && !hasMeasures && photoFiles.length === 0) {
      alert("Inserisci almeno il peso, una misura, una foto oppure una nota settimanale per il coach.");
      return;
    }

    btnSubmitWeeklyCheckin.disabled = true;
    const resetBtn = () => {
      btnSubmitWeeklyCheckin.disabled = false;
      btnSubmitWeeklyCheckin.textContent = "📤 Invia Check-in al Coach";
    };

    // Carica prima le foto (ridimensionate), poi salva il check-in
    const uploadedPaths = [];
    const photoPaths = {};
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const { pose, file } = photoFiles[i];
        btnSubmitWeeklyCheckin.textContent = `Caricamento foto ${i + 1}/${photoFiles.length}...`;
        const blob = await resizeProgressPhoto(file);
        const path = `${currentProfile.trainer_id}/${currentProfile.id}/${checkinDate}_${pose.key}_${Date.now()}.jpg`;
        const { error: upErr } = await supabaseClient.storage
          .from(PROGRESS_PHOTO_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`Caricamento foto ${pose.label} non riuscito: ${upErr.message}`);
        uploadedPaths.push(path);
        photoPaths[pose.key] = path;
      }
    } catch (err) {
      if (uploadedPaths.length) await supabaseClient.storage.from(PROGRESS_PHOTO_BUCKET).remove(uploadedPaths);
      resetBtn();
      alert(err.message);
      return;
    }

    btnSubmitWeeklyCheckin.textContent = "Invio in corso...";
    const row = {
      athlete_id: currentProfile.id,
      trainer_id: currentProfile.trainer_id,
      checkin_date: checkinDate,
      weight_kg: weightKg,
      adherence_score: adherence,
      sleep_score: sleep,
      energy_score: energy,
      stress_score: stress,
      athlete_notes: notes || null
    };
    if (hasMeasures) row.measurements = measurements;
    if (uploadedPaths.length) row.photo_paths = photoPaths;

    const { error } = await supabaseClient
      .from("weekly_checkins")
      .insert([row]);

    resetBtn();

    if (error) {
      if (uploadedPaths.length) await supabaseClient.storage.from(PROGRESS_PHOTO_BUCKET).remove(uploadedPaths);
      const missingColumns = /measurements|photo_paths/i.test(error.message || "");
      alert(missingColumns
        ? "Misure e foto non sono ancora attive: il database va aggiornato. Avvisa il tuo coach."
        : "Errore invio check-in: " + error.message);
      return;
    }

    document.getElementById("checkinAthleteNotes").value = "";
    resetCheckinExtras();
    alert("Check-in inviato con successo al tuo coach!");
    loadAthleteCheckinsHistory();
    if (typeof loadAthleteWorkout === "function") {
      loadAthleteWorkout();
    }
  });
}

// --- APERTURA VISTA CHECK-IN ATLETA LATO TRAINER (ULTIMI 30 GIORNI) ---
async function openTrainerAthleteCheckins(athleteId, athleteName) {
  const viewsToHide = [
    "trainerClientsView",
    "trainerProgressView",
    "trainerWorkoutsView",
    "trainerStatsView",
    "trainerAnamnesisView",
    "trainerBuilderView"
  ];
  viewsToHide.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const checkinsView = document.getElementById("trainerCheckinsView");
  const titleEl = document.getElementById("trainerCheckinsTitle");
  const container = document.getElementById("trainerCheckinsListContainer");

  if (!checkinsView || !container) return;
  checkinsView.classList.remove("hidden");
  if (titleEl) titleEl.textContent = `✅ Check-in — ${athleteName || "Atleta"}`;

  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento check-in...</div>`;

  const cutoffDate = getThirtyDaysAgoDateStr();

  const { data, error } = await supabaseClient
    .from("weekly_checkins")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("trainer_id", currentProfile.id)
    .gte("checkin_date", cutoffDate)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.84rem;">Errore: ${escapeCheckinHtml(error.message)}</div>`;
    return;
  }

  // Segna automaticamente come rivisti i check-in non ancora letti e aggiorna la campanella
  const hasUnreviewed = (data || []).some((item) => !item.reviewed_at);
  if (hasUnreviewed) {
    const nowIso = new Date().toISOString();
    await supabaseClient
      .from("weekly_checkins")
      .update({ reviewed_at: nowIso })
      .eq("athlete_id", athleteId)
      .eq("trainer_id", currentProfile.id)
      .is("reviewed_at", null);

    (data || []).forEach((item) => {
      if (!item.reviewed_at) item.reviewed_at = nowIso;
    });

    if (typeof loadTrainerClients === "function") {
      loadTrainerClients();
    }
  }

  // Tutti i check-in con foto (anche oltre 30 giorni) per il confronto prima/dopo
  const { data: photoRows } = await supabaseClient
    .from("weekly_checkins")
    .select("id, checkin_date, created_at, weight_kg, measurements, photo_paths")
    .eq("athlete_id", athleteId)
    .eq("trainer_id", currentProfile.id)
    .order("checkin_date", { ascending: true })
    .order("created_at", { ascending: true });
  const photoCheckins = (photoRows || []).filter(hasAnyCheckinPhoto);
  const compareHtml = photoCheckins.length >= 2 ? buildPhotoCompareHtml(photoCheckins) : "";

  if (!data || data.length === 0) {
    container.innerHTML = compareHtml + `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessun check-in inviato negli ultimi 30 giorni. Lo storico completo del peso resta disponibile nelle Statistiche.</div>`;
    if (compareHtml) initPhotoCompare(photoCheckins);
    return;
  }

  container.innerHTML = compareHtml + data.map((item, idx) => {
    const prevItem = data[idx + 1];
    let deltaBadge = "";
    if (item.weight_kg != null && prevItem && prevItem.weight_kg != null) {
      const diff = (Number(item.weight_kg) - Number(prevItem.weight_kg)).toFixed(1);
      const sign = diff > 0 ? "+" : "";
      deltaBadge = ` <span style="font-size: 0.75rem; color: var(--text-muted);">(${sign}${diff} kg)</span>`;
    }

    // Misure: variazione rispetto al check-in precedente che le aveva
    const prevWithMeasures = data.slice(idx + 1).find((x) => x.measurements && Object.keys(x.measurements).length);
    const measuresHtml = buildCheckinMeasuresHtml(item, prevWithMeasures ? prevWithMeasures.measurements : null);

    const statusBadge = item.reviewed_at
      ? `<span style="font-size: 0.72rem; color: #10b981; font-weight: 600;">✓ Rivisto</span>`
      : `<span style="font-size: 0.72rem; color: #f59e0b; font-weight: 600;">Nuovo</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <div>
            <strong style="font-size: 0.88rem; color: var(--primary);">📅 ${formatCheckinDateIt(item.checkin_date)}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 0.86rem;">
            ⚖️ <strong>${item.weight_kg != null ? item.weight_kg + " kg" : "n/d"}</strong>${deltaBadge}
          </div>
        </div>

        <div class="grid-2" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; gap: 6px;">
          <div>Aderenza: <strong style="color: var(--text);">${item.adherence_score ?? "-"}/5</strong></div>
          <div>Sonno: <strong style="color: var(--text);">${item.sleep_score ?? "-"}/5</strong></div>
          <div>Energia: <strong style="color: var(--text);">${item.energy_score ?? "-"}/5</strong></div>
          <div>Stress/Dolori: <strong style="color: var(--text);">${item.stress_score ?? "-"}/5</strong></div>
        </div>

        ${measuresHtml}
        ${buildCheckinPhotoThumbsHtml(item)}

        ${item.athlete_notes ? `<div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem; margin-bottom: 8px; white-space: pre-wrap;">${escapeCheckinHtml(item.athlete_notes)}</div>` : ""}

        <div class="field" style="margin-bottom: 6px;">
          <label style="font-size: 0.76rem;">Feedback / Risposta Coach</label>
          <textarea id="coachCheckinReply_${item.id}" rows="2" style="min-height: 54px; font-size: 0.82rem;" placeholder="Scrivi il tuo feedback per l'atleta...">${escapeCheckinHtml(item.coach_feedback || "")}</textarea>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="saveCoachCheckinFeedback('${item.id}', '${athleteId}', '${escapeJsAttr(athleteName || "")}')" style="width: auto;">💾 Salva Feedback</button>
      </div>
    `;
  }).join("");
  hydrateProgressPhotos(container);
  if (compareHtml) initPhotoCompare(photoCheckins);
}

// --- CONFRONTO FOTO PRIMA / DOPO (COACH) ---
function buildPhotoCompareHtml(rows) {
  const opts = (sel) => rows.map((r, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${formatCheckinDateIt(r.checkin_date)}</option>`).join("");
  return `
    <div class="photo-compare" id="photoCompareBox">
      <div class="photo-compare-head">
        <strong>Confronto foto</strong>
        <div class="photo-compare-poses" id="photoComparePoses">
          ${CHECKIN_PHOTO_POSES.map((p, i) => `<button type="button" class="photo-compare-pose${i === 0 ? " selected" : ""}" data-pose="${p.key}">${p.label}</button>`).join("")}
        </div>
      </div>
      <div class="photo-compare-grid">
        <div class="photo-compare-col">
          <select id="photoCompareA">${opts(0)}</select>
          <button type="button" class="checkin-thumb photo-compare-img" id="photoCompareImgA" onclick="openProgressPhotoViewer(this)"><img alt=""><span></span></button>
        </div>
        <div class="photo-compare-col">
          <select id="photoCompareB">${opts(rows.length - 1)}</select>
          <button type="button" class="checkin-thumb photo-compare-img" id="photoCompareImgB" onclick="openProgressPhotoViewer(this)"><img alt=""><span></span></button>
        </div>
      </div>
      <div class="photo-compare-diff" id="photoCompareDiff"></div>
    </div>
  `;
}

function initPhotoCompare(rows) {
  const selA = document.getElementById("photoCompareA");
  const selB = document.getElementById("photoCompareB");
  const posesBox = document.getElementById("photoComparePoses");
  const diffEl = document.getElementById("photoCompareDiff");
  if (!selA || !selB || !posesBox) return;
  let pose = CHECKIN_PHOTO_POSES[0].key;

  const setImg = async (btnId, row) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const img = btn.querySelector("img");
    const label = btn.querySelector("span");
    const path = row && row.photo_paths ? row.photo_paths[pose] : null;
    const poseLabel = (CHECKIN_PHOTO_POSES.find(p => p.key === pose) || {}).label || "";
    btn.title = `${poseLabel} · ${formatCheckinDateIt(row.checkin_date)}`;
    btn.classList.toggle("missing", !path);
    img.removeAttribute("src");
    label.textContent = path ? "" : `Nessuna foto ${poseLabel.toLowerCase()}`;
    if (path) {
      const url = await getProgressPhotoUrl(path);
      if (url) img.src = url; else btn.classList.add("missing");
    }
  };

  const render = () => {
    const a = rows[parseInt(selA.value, 10)], b = rows[parseInt(selB.value, 10)];
    setImg("photoCompareImgA", a);
    setImg("photoCompareImgB", b);
    // Differenze tra le due date: peso e misure presenti in entrambe
    const parts = [];
    if (a.weight_kg != null && b.weight_kg != null) {
      const d = Math.round((Number(b.weight_kg) - Number(a.weight_kg)) * 10) / 10;
      parts.push(`Peso <strong>${d > 0 ? "+" : ""}${String(d).replace(".", ",")} kg</strong>`);
    }
    CHECKIN_MEASURES.forEach((f) => {
      const va = a.measurements && a.measurements[f.key], vb = b.measurements && b.measurements[f.key];
      if (va != null && vb != null) {
        const d = Math.round((Number(vb) - Number(va)) * 10) / 10;
        parts.push(`${f.label} <strong>${d > 0 ? "+" : ""}${String(d).replace(".", ",")} cm</strong>`);
      }
    });
    diffEl.innerHTML = parts.length ? `Dal ${formatCheckinDateIt(a.checkin_date)} al ${formatCheckinDateIt(b.checkin_date)}: ${parts.join(" · ")}` : "";
  };

  selA.addEventListener("change", render);
  selB.addEventListener("change", render);
  posesBox.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-pose]");
    if (!btn) return;
    pose = btn.dataset.pose;
    posesBox.querySelectorAll("button").forEach((x) => x.classList.toggle("selected", x === btn));
    render();
  });
  render();
}

async function saveCoachCheckinFeedback(checkinId, athleteId, athleteName) {
  const textarea = document.getElementById(`coachCheckinReply_${checkinId}`);
  if (!textarea) return;
  const feedbackText = textarea.value.trim();

  const { error } = await supabaseClient
    .from("weekly_checkins")
    .update({
      coach_feedback: feedbackText || null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", checkinId)
    .eq("trainer_id", currentProfile.id);

  if (error) {
    alert("Errore salvataggio feedback: " + error.message);
    return;
  }

  alert("Feedback salvato e inviato all'atleta!");
  if (typeof loadTrainerClients === "function") {
    await loadTrainerClients();
  }
  openTrainerAthleteCheckins(athleteId, athleteName);
}

const btnBackFromTrainerCheckins = document.getElementById("btnBackFromTrainerCheckins");
if (btnBackFromTrainerCheckins) {
  btnBackFromTrainerCheckins.addEventListener("click", () => {
    document.getElementById("trainerCheckinsView").classList.add("hidden");
    document.getElementById("trainerClientsView").classList.remove("hidden");
  });
}
