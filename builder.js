const muscleFilter = document.getElementById("muscleFilter");
const exerciseSearch = document.getElementById("exerciseSearch");
const exerciseSuggestions = document.getElementById("exerciseSuggestions");
const exerciseSelect = document.getElementById("exerciseSelect");
const exerciseDaySelect = document.getElementById("exerciseDay");
const chkCircuitStart = document.getElementById("chkCircuitStart");
const chkCircuitEnd = document.getElementById("chkCircuitEnd");
const circuitLabelWrap = document.getElementById("circuitLabelWrap");
const inCircuitLabel = document.getElementById("inCircuitLabel");

const ADMIN_GLOBAL_EXERCISE_EMAIL = "carlo.ratto250889@gmail.com";
const EXERCISE_CACHE_KEY = "wb_exercise_db_cache_v1";

let currentDraftId = null;
let editingItemUid = null;
let searchDebounceTimer = null;
let EXERCISE_MAP = new Map();
let isLoadingExercises = false;

if (exerciseSearch) {
  exerciseSearch.removeAttribute("list");
}
if (exerciseSuggestions) {
  exerciseSuggestions.innerHTML = "";
}

function rebuildExerciseMap(list) {
  EXERCISE_MAP = new Map();
  (list || []).forEach(ex => {
    if (ex && ex.id) EXERCISE_MAP.set(ex.id, ex);
  });
}

function resolveExerciseImages(exOrId, fallbackStart = "", fallbackEnd = "") {
  const exObj = typeof exOrId === "string"
    ? EXERCISE_MAP.get(exOrId)
    : (exOrId && exOrId.id && EXERCISE_MAP.get(exOrId.id)) || exOrId;

  const start = (exObj && exObj.img_start) || fallbackStart || "";
  const end = (exObj && (exObj.img_end || exObj.img_start)) || fallbackEnd || start;
  return { imgStart: start, imgEnd: end };
}

function preloadExerciseImages(startUrl, endUrl) {
  [startUrl, endUrl].filter(Boolean).forEach(url => {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });
}

function buildItemPhotosHtml(imgStart, imgEnd, singleWidth = "82px") {
  if (!imgStart) return "";
  const isSingle = imgStart === imgEnd;
  const onErrAttr = `onerror="if(!this.dataset.retried){this.dataset.retried='1';const s=this.src;this.src='';setTimeout(()=>{this.src=s;},350);}else{this.style.display='none';}"`;

  if (isSingle) {
    return `<img src="${imgStart}" class="item-img" loading="lazy" decoding="async" style="width: ${singleWidth}; object-fit: contain;" ${onErrAttr}>`;
  }
  return `
    <img src="${imgStart}" class="item-img" loading="lazy" decoding="async" ${onErrAttr}>
    <img src="${imgEnd}" class="item-img" loading="lazy" decoding="async" ${onErrAttr}>
  `;
}

function syncSaveCloudButtonState() {
  const selectEl = document.getElementById("builderAthleteSelect");
  const btnSaveCloud = document.getElementById("btnSaveCloud");
  if (!selectEl || !btnSaveCloud) return;

  const hasLinkedAthlete = Boolean(selectEl.value && selectEl.value.trim() !== "");
  btnSaveCloud.disabled = !hasLinkedAthlete;

  if (hasLinkedAthlete) {
    btnSaveCloud.style.opacity = "1";
    btnSaveCloud.style.cursor = "pointer";
    btnSaveCloud.style.filter = "none";
    btnSaveCloud.title = "Salva e invia la scheda all'app dell'atleta";
  } else {
    btnSaveCloud.style.opacity = "0.45";
    btnSaveCloud.style.cursor = "not-allowed";
    btnSaveCloud.style.filter = "grayscale(100%)";
    btnSaveCloud.title = "Seleziona un atleta collegato all'app per abilitare l'invio";
  }
}

function isGlobalExerciseAdmin() {
  const email = (currentProfile && currentProfile.email) || (currentUser && currentUser.email) || "";
  return email.trim().toLowerCase() === ADMIN_GLOBAL_EXERCISE_EMAIL;
}

function getSafeTrainerClients() {
  return (typeof trainerClients !== "undefined" && Array.isArray(trainerClients)) ? trainerClients : [];
}

function hasOpenCircuitInDay(dayName) {
  const dayItems = currentWorkout.filter(item => item.day === dayName);
  let open = false;
  dayItems.forEach(item => {
    if (item.circuitRole === "start") open = true;
    else if (item.circuitRole === "end" || item.circuitRole === "single") open = false;
  });
  return open;
}

function syncCircuitCheckboxes() {
  const dayName = exerciseDaySelect.value;
  const isOpen = hasOpenCircuitInDay(dayName);

  const labelStart = chkCircuitStart.closest("label");
  const labelEnd = chkCircuitEnd.closest("label");

  if (isOpen) {
    chkCircuitStart.checked = false;
    chkCircuitStart.disabled = true;
    if (labelStart) {
      labelStart.style.opacity = "0.45";
      labelStart.style.cursor = "not-allowed";
    }

    chkCircuitEnd.disabled = false;
    if (labelEnd) {
      labelEnd.style.opacity = "1";
      labelEnd.style.cursor = "pointer";
    }
    circuitLabelWrap.classList.add("hidden");
  } else {
    chkCircuitStart.disabled = false;
    if (labelStart) {
      labelStart.style.opacity = "1";
      labelStart.style.cursor = "pointer";
    }

    chkCircuitEnd.checked = false;
    chkCircuitEnd.disabled = true;
    if (labelEnd) {
      labelEnd.style.opacity = "0.45";
      labelEnd.style.cursor = "not-allowed";
    }

    if (chkCircuitStart.checked) {
      circuitLabelWrap.classList.remove("hidden");
    } else {
      circuitLabelWrap.classList.add("hidden");
      inCircuitLabel.value = "";
    }
  }
}

exerciseDaySelect.addEventListener("change", syncCircuitCheckboxes);

chkCircuitStart.addEventListener("change", () => {
  if (chkCircuitStart.checked) {
    chkCircuitEnd.checked = false;
    circuitLabelWrap.classList.remove("hidden");
  } else {
    circuitLabelWrap.classList.add("hidden");
    inCircuitLabel.value = "";
  }
});

chkCircuitEnd.addEventListener("change", () => {
  if (chkCircuitEnd.checked) {
    chkCircuitStart.checked = false;
    circuitLabelWrap.classList.add("hidden");
  }
});

// --- GESTIONE CREAZIONE NUOVO ESERCIZIO (SOLO ADMIN carlo.ratto250889@gmail.com) ---
const btnToggleNewExBox = document.getElementById("btnToggleNewExerciseBox");
const btnCloseNewExBox = document.getElementById("btnCloseNewExerciseBox");
const newExerciseBox = document.getElementById("newExerciseBox");

function syncNewExerciseScopeUi() {
  const hintEl = document.getElementById("newExerciseScopeHint");
  const titleEl = document.getElementById("newExerciseBoxTitle");
  const optPersonal = document.getElementById("optPersonalExercises");
  const isAdmin = isGlobalExerciseAdmin();

  if (btnToggleNewExBox) {
    btnToggleNewExBox.classList.toggle("hidden", !isAdmin);
  }
  if (!isAdmin && newExerciseBox) {
    newExerciseBox.classList.add("hidden");
  }
  if (optPersonal) {
    optPersonal.classList.add("hidden");
    if (muscleFilter && muscleFilter.value === "PERSONAL") {
      muscleFilter.value = "ALL";
    }
  }

  if (isAdmin) {
    if (titleEl) titleEl.textContent = "➕ Crea Nuovo Esercizio (Catalogo Globale)";
    if (hintEl) hintEl.textContent = "Stai creando un esercizio globale: sarà visibile a tutti i Personal Trainer dell'app.";
  }
}

if (btnToggleNewExBox && newExerciseBox) {
  btnToggleNewExBox.addEventListener("click", () => {
    if (!isGlobalExerciseAdmin()) return;
    syncNewExerciseScopeUi();
    newExerciseBox.classList.toggle("hidden");
  });
}

if (btnCloseNewExBox && newExerciseBox) {
  btnCloseNewExBox.addEventListener("click", () => {
    newExerciseBox.classList.add("hidden");
  });
}

// Comprime automaticamente immagini pesanti prima dell'upload (da MB a ~60KB)
async function compressImageBeforeUpload(file, maxDim = 720, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size < 250 * 1024) {
          resolve(file);
          return;
        }
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = ev.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function uploadExerciseImageFile(file, slotLabel) {
  if (!file || !currentProfile) return null;
  const optimizedFile = await compressImageBeforeUpload(file);
  const rawExt = (optimizedFile.name && optimizedFile.name.includes(".")) ? optimizedFile.name.split(".").pop().toLowerCase() : "jpg";
  const safeExt = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const filePath = `${currentProfile.id}/${Date.now()}_${slotLabel}_${Math.random().toString(36).slice(2, 7)}.${safeExt}`;

  const { error: uploadErr } = await supabaseClient.storage
    .from("exercise-images")
    .upload(filePath, optimizedFile, {
      cacheControl: "31536000",
      upsert: false,
      contentType: optimizedFile.type || "image/jpeg"
    });

  if (uploadErr) {
    throw new Error(`Errore caricamento immagine (${slotLabel}): ${uploadErr.message}`);
  }

  const { data: pubData } = supabaseClient.storage
    .from("exercise-images")
    .getPublicUrl(filePath);

  return pubData ? pubData.publicUrl : null;
}

const btnSaveNewExercise = document.getElementById("btnSaveNewExercise");
if (btnSaveNewExercise) {
  btnSaveNewExercise.addEventListener("click", async () => {
    if (!isGlobalExerciseAdmin()) {
      alert("Non hai i permessi per aggiungere esercizi al catalogo.");
      return;
    }

    const nameVal = document.getElementById("newExName").value.trim();
    const muscleVal = document.getElementById("newExMuscle").value;
    const fileStart = document.getElementById("newExImgStart").files[0] || null;
    const fileEnd = document.getElementById("newExImgEnd").files[0] || null;

    if (!nameVal) {
      alert("Inserisci il nome dell'esercizio.");
      return;
    }

    btnSaveNewExercise.disabled = true;
    btnSaveNewExercise.textContent = "Salvataggio in corso...";

    try {
      const [url1, url2] = await Promise.all([
        fileStart ? uploadExerciseImageFile(fileStart, "start") : Promise.resolve(null),
        fileEnd ? uploadExerciseImageFile(fileEnd, "end") : Promise.resolve(null)
      ]);

      let finalImgStart = null;
      let finalImgEnd = null;
      if (url1 && url2) {
        finalImgStart = url1;
        finalImgEnd = url2;
      } else if (url1 || url2) {
        finalImgStart = url1 || url2;
        finalImgEnd = finalImgStart;
      }

      const customId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const { data: createdEx, error: insertErr } = await supabaseClient
        .from("exercises")
        .insert([{
          id: customId,
          name: nameVal,
          muscle: muscleVal,
          img_start: finalImgStart,
          img_end: finalImgEnd,
          trainer_id: null
        }])
        .select()
        .single();

      if (insertErr || !createdEx) {
        throw new Error(insertErr ? insertErr.message : "Errore sconosciuto durante l'inserimento.");
      }

      document.getElementById("newExName").value = "";
      document.getElementById("newExImgStart").value = "";
      document.getElementById("newExImgEnd").value = "";
      if (newExerciseBox) newExerciseBox.classList.add("hidden");

      EXERCISE_DB.push(createdEx);
      EXERCISE_DB.sort((a, b) => a.name.localeCompare(b.name, "it"));
      rebuildExerciseMap(EXERCISE_DB);
      try { localStorage.setItem(EXERCISE_CACHE_KEY, JSON.stringify(EXERCISE_DB)); } catch (_) {}

      document.getElementById("dbCount").textContent = `${EXERCISE_DB.length} esercizi`;
      muscleFilter.value = "ALL";
      exerciseSearch.value = "";
      populateDropdown();
      exerciseSelect.value = createdEx.id;
      updatePreview();

      alert(`✅ Esercizio "${createdEx.name}" aggiunto al catalogo globale!`);
    } catch (err) {
      alert(err.message);
    } finally {
      btnSaveNewExercise.disabled = false;
      btnSaveNewExercise.textContent = "💾 Salva Esercizio in Libreria";
    }
  });
}

const btnDeleteCustomExercise = document.getElementById("btnDeleteCustomExercise");
if (btnDeleteCustomExercise) {
  btnDeleteCustomExercise.addEventListener("click", async () => {
    const selected = EXERCISE_MAP.get(exerciseSelect.value);
    if (!selected) return;

    if (!isGlobalExerciseAdmin()) {
      alert("Non hai i permessi per eliminare esercizi dal catalogo.");
      return;
    }

    if (!confirm(`Vuoi eliminare definitivamente l'esercizio "${selected.name}" dalla libreria?`)) return;

    const { error } = await supabaseClient
      .from("exercises")
      .delete()
      .eq("id", selected.id);

    if (error) {
      alert("Errore eliminazione esercizio: " + error.message);
      return;
    }

    EXERCISE_DB = EXERCISE_DB.filter(ex => ex.id !== selected.id);
    rebuildExerciseMap(EXERCISE_DB);
    try { localStorage.setItem(EXERCISE_CACHE_KEY, JSON.stringify(EXERCISE_DB)); } catch (_) {}
    document.getElementById("dbCount").textContent = `${EXERCISE_DB.length} esercizi`;
    populateDropdown();
  });
}

async function loadExercisesFromCloud(forceRefresh = false) {
  syncSaveCloudButtonState();
  syncNewExerciseScopeUi();

  // Mostra subito la cache locale se disponibile (zero attesa al boot)
  if (!forceRefresh && (!Array.isArray(EXERCISE_DB) || EXERCISE_DB.length === 0)) {
    try {
      const cachedRaw = localStorage.getItem(EXERCISE_CACHE_KEY);
      if (cachedRaw) {
        const cachedList = JSON.parse(cachedRaw);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          EXERCISE_DB = cachedList;
          rebuildExerciseMap(EXERCISE_DB);
          document.getElementById("dbCount").textContent = `${EXERCISE_DB.length} esercizi`;
          populateDropdown();
        }
      }
    } catch (_) {}
  }

  if (isLoadingExercises) return;
  isLoadingExercises = true;

  try {
    const { data, error } = await supabaseClient
      .from('exercises')
      .select('id, name, muscle, img_start, img_end, trainer_id')
      .order('name', { ascending: true });

    if (error) {
      console.error("Errore caricamento esercizi:", error.message);
      if (!EXERCISE_DB || EXERCISE_DB.length === 0) {
        document.getElementById("dbCount").textContent = "Err DB";
      }
      return;
    }

    if (data) {
      const prevSelected = exerciseSelect ? exerciseSelect.value : "";
      EXERCISE_DB = data;
      rebuildExerciseMap(EXERCISE_DB);
      try { localStorage.setItem(EXERCISE_CACHE_KEY, JSON.stringify(EXERCISE_DB)); } catch (_) {}

      document.getElementById("dbCount").textContent = `${EXERCISE_DB.length} esercizi`;
      syncNewExerciseScopeUi();
      populateDropdown();
      if (prevSelected && EXERCISE_MAP.has(prevSelected)) {
        exerciseSelect.value = prevSelected;
        updatePreview();
      }
    }
  } finally {
    isLoadingExercises = false;
    syncCircuitCheckboxes();
  }
}

async function loadTrainerDrafts() {
  if (!currentProfile || currentProfile.role !== 'trainer') return;

  const { data: drafts, error } = await supabaseClient
    .from('workouts')
    .select('id, athlete_id, title, duration_weeks, created_at, workout_exercises(count)')
    .eq('trainer_id', currentProfile.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  const card = document.getElementById("trainerDraftsCard");
  const listEl = document.getElementById("trainerDraftsList");
  const countEl = document.getElementById("draftsCountBadge");

  if (error || !drafts || drafts.length === 0) {
    card.classList.add("hidden");
    listEl.innerHTML = "";
    return;
  }

  card.classList.remove("hidden");
  countEl.textContent = `${drafts.length} ${drafts.length === 1 ? 'bozza' : 'bozze'}`;

  const clientsList = getSafeTrainerClients();

  listEl.innerHTML = drafts.map(d => {
    const client = clientsList.find(c => c.id === d.athlete_id);
    const labelName = client ? client.full_name : (d.title || "Bozza senza atleta");
    const exCount = d.workout_exercises?.[0]?.count ?? 0;
    const dateStr = new Date(d.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const isCurrent = currentDraftId === d.id;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; background: var(--subcard-bg); border: 1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 9px 11px; margin-bottom: 6px;">
        <div>
          <strong style="font-size: 0.86rem; display: block;">${escapeHtml(labelName)} ${isCurrent ? '<span style="color:var(--primary); font-size:0.72rem;">(aperta ora)</span>' : ''}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${d.duration_weeks} sett. • ${exCount} esercizi • Salvata il ${dateStr}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="resumeDraft('${d.id}')">✏️ Riprendi</button>
          <button type="button" class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteDraft('${d.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join("");
}

window.resumeDraft = async function(draftId) {
  try {
    const { data: workout, error } = await supabaseClient
      .from('workouts')
      .select('id, athlete_id, title, duration_weeks, general_notes, workout_exercises(id, exercise_id, day_name, sets_reps, rest, rir, notes, order_index, circuit_role, circuit_label)')
      .eq('id', draftId)
      .single();

    if (error || !workout) {
      alert("Errore nel caricamento della bozza: " + (error ? error.message : "non trovata"));
      return;
    }

    if (typeof showTrainerView === "function") {
      showTrainerView("trainerBuilderView");
    }
    currentDraftId = workout.id;
    editingItemUid = null;

    const selectEl = document.getElementById("builderAthleteSelect");
    const loadBtn = document.getElementById("btnLoadExistingWorkout");
    const clientsList = getSafeTrainerClients();

    if (workout.athlete_id) {
      if (selectEl) selectEl.value = workout.athlete_id;
      const found = clientsList.find(c => c.id === workout.athlete_id);
      let resolvedName = found ? found.full_name : "";
      if (!resolvedName && selectEl && selectEl.selectedOptions && selectEl.selectedOptions[0]) {
        resolvedName = selectEl.selectedOptions[0].textContent.split(" (")[0].trim();
      }
      if (!resolvedName && workout.title && workout.title !== "Bozza Scheda") {
        resolvedName = workout.title;
      }
      document.getElementById("athleteName").value = resolvedName;
      if (loadBtn) loadBtn.classList.remove("hidden");
    } else {
      if (selectEl) selectEl.value = "";
      document.getElementById("athleteName").value = (workout.title && workout.title !== "Bozza Scheda") ? workout.title : "";
      if (loadBtn) loadBtn.classList.add("hidden");
    }

    syncSaveCloudButtonState();

    document.getElementById("durationWeeks").value = workout.duration_weeks || 4;
    document.getElementById("generalNotes").value = workout.general_notes || "";

    const sortedItems = (workout.workout_exercises || []).sort((a, b) => a.order_index - b.order_index);
    currentWorkout = sortedItems.map((row, idx) => {
      const exFromDb = EXERCISE_MAP.get(row.exercise_id) || null;
      const imgs = resolveExerciseImages(exFromDb);
      return {
        uid: Date.now() + idx,
        id: row.exercise_id,
        day: row.day_name,
        name: exFromDb ? exFromDb.name : "Esercizio",
        muscle: exFromDb ? exFromDb.muscle : "",
        imgStart: imgs.imgStart,
        imgEnd: imgs.imgEnd,
        setsReps: row.sets_reps,
        rest: row.rest,
        rir: row.rir,
        notes: row.notes,
        circuitRole: row.circuit_role || null,
        circuitLabel: row.circuit_label || ""
      };
    });

    renderList();
    loadTrainerDrafts();
  } catch (err) {
    console.error("Errore resumeDraft:", err);
    alert("Impossibile riprendere la bozza: " + err.message);
  }
};

window.deleteDraft = async function(draftId) {
  if (!confirm("Eliminare questa bozza?")) return;

  await Promise.all([
    supabaseClient.from('workout_exercises').delete().eq('workout_id', draftId),
    supabaseClient.from('workouts').delete().eq('id', draftId).eq('trainer_id', currentProfile.id)
  ]);

  if (currentDraftId === draftId) currentDraftId = null;
  loadTrainerDrafts();
};

document.getElementById("btnSaveDraft").addEventListener("click", async () => {
  if (currentWorkout.length === 0) {
    alert("Inserisci almeno un esercizio prima di salvare la bozza!");
    return;
  }

  const btn = document.getElementById("btnSaveDraft");
  btn.disabled = true;
  btn.textContent = "Salvataggio...";

  try {
    const athleteId = document.getElementById("builderAthleteSelect").value || null;
    const pdfName = document.getElementById("athleteName").value.trim();
    const durationWeeks = parseInt(document.getElementById("durationWeeks").value) || 4;
    const generalNotes = document.getElementById("generalNotes").value.trim();

    let targetWorkoutId = currentDraftId;

    if (targetWorkoutId) {
      // Esegue in parallelo aggiornamento testata bozza e pulizia vecchie righe
      const [updateRes, deleteRes] = await Promise.all([
        supabaseClient
          .from('workouts')
          .update({
            athlete_id: athleteId,
            title: pdfName || "Bozza Scheda",
            general_notes: generalNotes,
            duration_weeks: durationWeeks
          })
          .eq('id', targetWorkoutId)
          .eq('trainer_id', currentProfile.id),
        supabaseClient
          .from('workout_exercises')
          .delete()
          .eq('workout_id', targetWorkoutId)
      ]);

      if (updateRes.error) {
        alert("Errore aggiornamento bozza: " + updateRes.error.message);
        return;
      }
      if (deleteRes.error) {
        alert("Errore pulizia esercizi bozza: " + deleteRes.error.message);
        return;
      }
    } else {
      const { data: createdDraft, error: cErr } = await supabaseClient
        .from('workouts')
        .insert({
          trainer_id: currentProfile.id,
          athlete_id: athleteId,
          title: pdfName || "Bozza Scheda",
          general_notes: generalNotes,
          duration_weeks: durationWeeks,
          status: 'draft'
        })
        .select('id')
        .single();

      if (cErr || !createdDraft) {
        alert("Errore salvataggio bozza: " + (cErr ? cErr.message : "sconosciuto"));
        return;
      }

      targetWorkoutId = createdDraft.id;
      currentDraftId = targetWorkoutId;
    }

    const rowsToInsert = currentWorkout.map((ex, idx) => ({
      workout_id: targetWorkoutId,
      exercise_id: ex.id,
      day_name: ex.day,
      sets_reps: ex.setsReps,
      rest: ex.rest,
      rir: ex.rir,
      notes: ex.notes,
      order_index: idx,
      circuit_role: ex.circuitRole || null,
      circuit_label: ex.circuitLabel || null
    }));

    const { error: exError } = await supabaseClient
      .from('workout_exercises')
      .insert(rowsToInsert);

    if (exError) {
      alert("Bozza salvata ma errore sugli esercizi: " + exError.message);
    } else {
      alert("📝 Bozza salvata! Puoi chiudere l'app e riprenderla quando vuoi.");
      loadTrainerDrafts();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "📝 Salva Bozza";
  }
});

document.getElementById("builderAthleteSelect").addEventListener("change", (e) => {
  const athleteId = e.target.value;
  const loadBtn = document.getElementById("btnLoadExistingWorkout");
  if (athleteId) {
    const found = getSafeTrainerClients().find(c => c.id === athleteId);
    if (found) document.getElementById("athleteName").value = found.full_name;
    loadBtn.classList.remove("hidden");
  } else {
    loadBtn.classList.add("hidden");
  }
  syncSaveCloudButtonState();
});

document.getElementById("btnLoadExistingWorkout").addEventListener("click", async () => {
  const athleteId = document.getElementById("builderAthleteSelect").value;
  if (!athleteId) return;

  const btn = document.getElementById("btnLoadExistingWorkout");
  btn.disabled = true;
  btn.textContent = "Caricamento...";

  const { data: workout, error } = await supabaseClient
    .from('workouts')
    .select('id, duration_weeks, general_notes, workout_exercises(id, exercise_id, day_name, sets_reps, rest, rir, notes, order_index, circuit_role, circuit_label)')
    .eq('trainer_id', currentProfile.id)
    .eq('athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  btn.disabled = false;
  btn.textContent = "📥 Carica Scheda Attuale";

  if (error || !workout) {
    alert("Nessuna scheda attiva trovata per questo atleta.");
    return;
  }

  currentDraftId = null;
  editingItemUid = null;
  document.getElementById("durationWeeks").value = workout.duration_weeks || 4;
  document.getElementById("generalNotes").value = workout.general_notes || "";

  const sortedItems = (workout.workout_exercises || []).sort((a, b) => a.order_index - b.order_index);
  currentWorkout = sortedItems.map((row, idx) => {
    const exFromDb = EXERCISE_MAP.get(row.exercise_id) || null;
    const imgs = resolveExerciseImages(exFromDb);
    return {
      uid: Date.now() + idx,
      id: row.exercise_id,
      day: row.day_name,
      name: exFromDb ? exFromDb.name : "Esercizio",
      muscle: exFromDb ? exFromDb.muscle : "",
      imgStart: imgs.imgStart,
      imgEnd: imgs.imgEnd,
      setsReps: row.sets_reps,
      rest: row.rest,
      rir: row.rir,
      notes: row.notes,
      circuitRole: row.circuit_role || null,
      circuitLabel: row.circuit_label || ""
    };
  });

  renderList();
  loadTrainerDrafts();
});

document.getElementById("btnClearBuilder").addEventListener("click", () => {
  if (!confirm("Vuoi rimuovere tutti gli esercizi inseriti in questa scheda?")) return;
  currentWorkout = [];
  currentDraftId = null;
  editingItemUid = null;
  renderList();
  loadTrainerDrafts();
});

function populateDropdown() {
  const filter = muscleFilter.value;
  const search = exerciseSearch.value.trim().toLowerCase();

  const filtered = EXERCISE_DB.filter(ex => {
    const matchMuscle = filter === "ALL" ? true : ex.muscle === filter;
    const matchSearch = !search || ex.name.toLowerCase().includes(search);
    return matchMuscle && matchSearch;
  });

  if (filtered.length === 0) {
    exerciseSelect.innerHTML = `<option value="">Nessun esercizio trovato</option>`;
    updatePreview();
    return;
  }

  exerciseSelect.innerHTML = filtered
    .map(ex => `<option value="${ex.id}">${escapeHtml(ex.name)} (${escapeHtml(ex.muscle)})</option>`)
    .join("");

  updatePreview();
}

function updatePreview() {
  const selected = EXERCISE_MAP.get(exerciseSelect.value);
  const photosContainer = document.getElementById("previewPhotosContainer");
  const deleteBtn = document.getElementById("btnDeleteCustomExercise");

  if (!selected) {
    if (photosContainer) photosContainer.style.display = "none";
    document.getElementById("previewName").textContent = "-";
    document.getElementById("previewMuscle").textContent = "-";
    if (deleteBtn) deleteBtn.classList.add("hidden");
    return;
  }

  const startSrc = selected.img_start || "";
  const endSrc = selected.img_end || selected.img_start || "";
  const isSingle = startSrc === endSrc;

  preloadExerciseImages(startSrc, endSrc);

  const imgStartEl = document.getElementById("previewImgStart");
  const wrapEndEl = document.getElementById("wrapImgEnd");
  const tagStartEl = document.getElementById("tagImgStart");

  document.getElementById("previewName").textContent = selected.name;
  document.getElementById("previewMuscle").textContent = selected.muscle;

  if (!startSrc) {
    if (photosContainer) photosContainer.style.display = "none";
  } else {
    if (photosContainer) photosContainer.style.display = "flex";
    imgStartEl.decoding = "async";
    imgStartEl.onerror = () => {
      if (!imgStartEl.dataset.retried) {
        imgStartEl.dataset.retried = "1";
        setTimeout(() => { imgStartEl.src = startSrc; }, 350);
      }
    };
    imgStartEl.dataset.retried = "";
    imgStartEl.src = startSrc;

    if (isSingle) {
      wrapEndEl.style.display = "none";
      imgStartEl.style.width = "105px";
      imgStartEl.style.objectFit = "contain";
      tagStartEl.textContent = "Esecuzione";
    } else {
      wrapEndEl.style.display = "flex";
      imgStartEl.style.width = "64px";
      imgStartEl.style.objectFit = "cover";
      tagStartEl.textContent = "Partenza";
      const imgEndEl = document.getElementById("previewImgEnd");
      imgEndEl.decoding = "async";
      imgEndEl.onerror = () => {
        if (!imgEndEl.dataset.retried) {
          imgEndEl.dataset.retried = "1";
          setTimeout(() => { imgEndEl.src = endSrc; }, 350);
        }
      };
      imgEndEl.dataset.retried = "";
      imgEndEl.src = endSrc;
    }
  }

  if (deleteBtn) {
    deleteBtn.classList.toggle("hidden", !isGlobalExerciseAdmin());
  }
}

muscleFilter.addEventListener("change", populateDropdown);

exerciseSearch.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(populateDropdown, 100);
});

exerciseSelect.addEventListener("change", updatePreview);

document.getElementById("btnAddEx").addEventListener("click", () => {
  const selected = EXERCISE_MAP.get(exerciseSelect.value);
  if (!selected) return;

  const isStart = chkCircuitStart.checked && !chkCircuitStart.disabled;
  const isEnd = chkCircuitEnd.checked && !chkCircuitEnd.disabled;
  let circuitRole = null;
  if (isStart) circuitRole = "start";
  else if (isEnd) circuitRole = "end";

  const imgs = resolveExerciseImages(selected);

  currentWorkout.push({
    uid: Date.now(),
    id: selected.id,
    day: exerciseDaySelect.value,
    name: selected.name,
    muscle: selected.muscle,
    imgStart: imgs.imgStart,
    imgEnd: imgs.imgEnd,
    setsReps: document.getElementById("inSetsReps").value.trim() || "-",
    rest: document.getElementById("inRest").value.trim() || "-",
    rir: document.getElementById("inRir").value.trim() || "-",
    notes: document.getElementById("inNotes").value.trim() || "-",
    circuitRole: circuitRole,
    circuitLabel: isStart ? inCircuitLabel.value.trim() : ""
  });

  document.getElementById("inSetsReps").value = "";
  document.getElementById("inRest").value = "";
  document.getElementById("inRir").value = "";
  document.getElementById("inNotes").value = "";
  chkCircuitStart.checked = false;
  chkCircuitEnd.checked = false;
  circuitLabelWrap.classList.add("hidden");
  inCircuitLabel.value = "";

  renderList();
});

function buildBuilderItemHtml(item, idx, totalInDay) {
  const imgs = resolveExerciseImages(item.id, item.imgStart, item.imgEnd);
  item.imgStart = imgs.imgStart;
  item.imgEnd = imgs.imgEnd;

  const isEditing = editingItemUid === item.uid;
  let roleTag = "";
  if (item.circuitRole === "start") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 INIZIO CIRCUITO</span>`;
  } else if (item.circuitRole === "end") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🏁 FINE CIRCUITO</span>`;
  } else if (item.circuitRole === "single") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 BLOCCO CIRCUITO</span>`;
  }

  const editFormHtml = isEditing ? `
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); display: flex; flex-direction: column; gap: 6px;">
      <div class="grid-3">
        <div class="field" style="margin:0;">
          <label style="font-size:0.72rem;">Serie e Reps</label>
          <input type="text" id="editSets_${item.uid}" value="${item.setsReps === '-' ? '' : escapeHtml(item.setsReps)}" placeholder="es. 4x8-10">
        </div>
        <div class="field" style="margin:0;">
          <label style="font-size:0.72rem;">Rest</label>
          <input type="text" id="editRest_${item.uid}" value="${item.rest === '-' ? '' : escapeHtml(item.rest)}" placeholder="es. 90''">
        </div>
        <div class="field" style="margin:0;">
          <label style="font-size:0.72rem;">RIR / @</label>
          <input type="text" id="editRir_${item.uid}" value="${item.rir === '-' ? '' : escapeHtml(item.rir)}" placeholder="es. RIR 1">
        </div>
      </div>
      <div class="field" style="margin:0;">
        <label style="font-size:0.72rem;">Note Esercizio</label>
        <textarea id="editNotes_${item.uid}" rows="2" style="min-height: 54px; font-size: 0.8rem;" placeholder="Note tecniche per questo esercizio...">${item.notes === '-' ? '' : escapeHtml(item.notes)}</textarea>
      </div>
      <div style="display: flex; gap: 6px; justify-content: flex-end;">
        <button type="button" class="btn btn-outline btn-sm" style="width:auto;" onclick="cancelEditItem()">Annulla</button>
        <button type="button" class="btn btn-success btn-sm" style="width:auto;" onclick="saveEditedItem(${item.uid})">💾 Salva Modifiche</button>
      </div>
    </div>
  ` : "";

  return `
    <div class="exercise-item" style="${isEditing ? 'border-color: var(--primary);' : ''}">
      <div class="exercise-top">
        <div class="item-photos">
          ${buildItemPhotosHtml(imgs.imgStart, imgs.imgEnd, "82px")}
        </div>
        <div class="item-details">
          <strong>${idx + 1}. ${escapeHtml(item.name)}</strong> ${roleTag}
          <div class="item-sub"><strong>${escapeHtml(item.setsReps)}</strong> | Rest: ${escapeHtml(item.rest)} | RIR/@: ${escapeHtml(item.rir)}</div>
          ${item.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(item.notes)}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn-icon" title="Sposta su" onclick="moveItem(${item.uid}, -1)" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn-icon" title="Sposta giù" onclick="moveItem(${item.uid}, 1)" ${idx === totalInDay - 1 ? 'disabled' : ''}>▼</button>
          <button class="btn-icon" title="Modifica parametri" onclick="editItem(${item.uid})">✏️</button>
          <button class="btn-icon" title="Rimuovi" style="color:var(--danger);" onclick="removeItem(${item.uid})">✖</button>
        </div>
      </div>
      ${editFormHtml}
    </div>
  `;
}

function renderList() {
  const listEl = document.getElementById("exerciseList");
  const clearBtn = document.getElementById("btnClearBuilder");
  document.getElementById("counterLabel").textContent = `${currentWorkout.length} inseriti`;

  syncCircuitCheckboxes();

  if (currentWorkout.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Nessun esercizio aggiunto</div>`;
    clearBtn.classList.add("hidden");
    return;
  }

  clearBtn.classList.remove("hidden");
  listEl.innerHTML = "";

  const grouped = {};
  currentWorkout.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = [];
    grouped[item.day].push(item);
  });

  Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const dayItems = grouped[dayName];
    const groupDiv = document.createElement("div");
    groupDiv.className = "day-group";
    groupDiv.innerHTML = `<div class="day-badge">📅 ${escapeHtml(dayName)} (${dayItems.length} ESERCIZI)</div>`;

    let inCircuit = false;
    let circuitHtmlBuffer = "";
    let circuitHeaderTitle = "CIRCUITO";

    dayItems.forEach((item, idx) => {
      const itemHtml = buildBuilderItemHtml(item, idx, dayItems.length);

      if (item.circuitRole === "single") {
        if (inCircuit) {
          groupDiv.innerHTML += `
            <div class="circuit-group-box">
              <div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitHeaderTitle)}</span><span>INIZIO CIRCUITO</span></div>
              ${circuitHtmlBuffer}
              <div class="circuit-group-footer">🏁 Fine Circuito</div>
            </div>
          `;
          inCircuit = false;
          circuitHtmlBuffer = "";
        }
        const label = item.circuitLabel ? item.circuitLabel : "BLOCCO CIRCUITO";
        groupDiv.innerHTML += `
          <div class="circuit-group-box">
            <div class="circuit-group-header"><span>🔄 ${escapeHtml(label)}</span><span>CIRCUITO</span></div>
            ${itemHtml}
            <div class="circuit-group-footer">🏁 Fine Circuito</div>
          </div>
        `;
      } else if (item.circuitRole === "start") {
        if (inCircuit) {
          groupDiv.innerHTML += `
            <div class="circuit-group-box">
              <div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitHeaderTitle)}</span><span>INIZIO CIRCUITO</span></div>
              ${circuitHtmlBuffer}
              <div class="circuit-group-footer">🏁 Fine Circuito</div>
            </div>
          `;
        }
        inCircuit = true;
        circuitHeaderTitle = item.circuitLabel ? item.circuitLabel : "CIRCUITO";
        circuitHtmlBuffer = itemHtml;
      } else if (item.circuitRole === "end") {
        if (inCircuit) {
          circuitHtmlBuffer += itemHtml;
          groupDiv.innerHTML += `
            <div class="circuit-group-box">
              <div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitHeaderTitle)}</span><span>INIZIO CIRCUITO</span></div>
              ${circuitHtmlBuffer}
              <div class="circuit-group-footer">🏁 Fine Circuito</div>
            </div>
          `;
          inCircuit = false;
          circuitHtmlBuffer = "";
        } else {
          groupDiv.innerHTML += itemHtml;
        }
      } else {
        if (inCircuit) {
          circuitHtmlBuffer += itemHtml;
        } else {
          groupDiv.innerHTML += itemHtml;
        }
      }
    });

    if (inCircuit) {
      groupDiv.innerHTML += `
        <div class="circuit-group-box" style="border-style: dashed;">
          <div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitHeaderTitle)}</span><span>INIZIO CIRCUITO (in corso...)</span></div>
          ${circuitHtmlBuffer}
          <div class="circuit-group-footer">⏳ Aggiungi l'ultimo esercizio spuntando "Fine Circuito" per chiudere</div>
        </div>
      `;
    }

    listEl.appendChild(groupDiv);
  });
}

window.editItem = function(uid) {
  editingItemUid = (editingItemUid === uid) ? null : uid;
  renderList();
};

window.cancelEditItem = function() {
  editingItemUid = null;
  renderList();
};

window.saveEditedItem = function(uid) {
  const index = currentWorkout.findIndex(item => item.uid === uid);
  if (index === -1) return;
  const item = currentWorkout[index];

  const newSets = document.getElementById(`editSets_${uid}`).value.trim();
  const newRest = document.getElementById(`editRest_${uid}`).value.trim();
  const newRir = document.getElementById(`editRir_${uid}`).value.trim();
  const newNotes = document.getElementById(`editNotes_${uid}`).value.trim();

  item.setsReps = newSets || "-";
  item.rest = newRest || "-";
  item.rir = newRir || "-";
  item.notes = newNotes || "-";
  editingItemUid = null;
  renderList();
};

window.moveItem = function(uid, direction) {
  const index = currentWorkout.findIndex(item => item.uid === uid);
  if (index === -1) return;
  const targetDay = currentWorkout[index].day;
  const dayIndices = currentWorkout
    .map((item, idx) => item.day === targetDay ? idx : -1)
    .filter(idx => idx !== -1);

  const posInDay = dayIndices.indexOf(index);
  const newPosInDay = posInDay + direction;
  if (newPosInDay < 0 || newPosInDay >= dayIndices.length) return;

  const swapIndex = dayIndices[newPosInDay];
  const temp = currentWorkout[index];
  currentWorkout[index] = currentWorkout[swapIndex];
  currentWorkout[swapIndex] = temp;
  renderList();
};

window.removeItem = function(uid) {
  if (editingItemUid === uid) editingItemUid = null;
  currentWorkout = currentWorkout.filter(item => item.uid !== uid);
  renderList();
};

document.getElementById("btnSaveCloud").addEventListener("click", async () => {
  const athleteId = document.getElementById("builderAthleteSelect").value;
  if (!athleteId) {
    alert("Seleziona prima un atleta collegato dal menu a tendina in alto!");
    return;
  }
  if (currentWorkout.length === 0) {
    alert("Inserisci almeno un esercizio prima di salvare!");
    return;
  }

  const btn = document.getElementById("btnSaveCloud");
  btn.disabled = true;
  btn.textContent = "Invio in corso...";

  try {
    const durationWeeks = parseInt(document.getElementById("durationWeeks").value) || 4;
    const generalNotes = document.getElementById("generalNotes").value.trim();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (durationWeeks * 7));

    // Archivia eventuale scheda precedente e crea la nuova in parallelo
    const [, insertWorkoutRes] = await Promise.all([
      supabaseClient
        .from('workouts')
        .update({ status: 'archived' })
        .eq('athlete_id', athleteId)
        .eq('status', 'active'),
      supabaseClient
        .from('workouts')
        .insert({
          trainer_id: currentProfile.id,
          athlete_id: athleteId,
          title: `Scheda ${durationWeeks} Settimane`,
          general_notes: generalNotes,
          duration_weeks: durationWeeks,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        })
        .select('id')
        .single()
    ]);

    const { data: newWorkout, error: wError } = insertWorkoutRes;

    if (wError || !newWorkout) {
      alert("Errore salvataggio scheda: " + (wError ? wError.message : "sconosciuto"));
      return;
    }

    const rowsToInsert = currentWorkout.map((ex, idx) => ({
      workout_id: newWorkout.id,
      exercise_id: ex.id,
      day_name: ex.day,
      sets_reps: ex.setsReps,
      rest: ex.rest,
      rir: ex.rir,
      notes: ex.notes,
      order_index: idx,
      circuit_role: ex.circuitRole || null,
      circuit_label: ex.circuitLabel || null
    }));

    const { error: exError } = await supabaseClient
      .from('workout_exercises')
      .insert(rowsToInsert);

    if (exError) {
      alert("Scheda creata ma errore negli esercizi: " + exError.message);
      return;
    }

    if (currentDraftId) {
      const draftToDelete = currentDraftId;
      currentDraftId = null;
      await Promise.all([
        supabaseClient.from('workout_exercises').delete().eq('workout_id', draftToDelete),
        supabaseClient.from('workouts').delete().eq('id', draftToDelete)
      ]);
    }

    alert("✅ Scheda salvata e inviata! L'atleta la vedrà immediatamente aprendo la sua app.");
    currentWorkout = [];
    editingItemUid = null;
    renderList();
    showTrainerView("trainerClientsView");
    loadTrainerClients();
  } finally {
    btn.textContent = "☁️ Salva e Invia all'app dell'Atleta";
    syncSaveCloudButtonState();
  }
});

// Generazione PDF Stampabile centrata su Desktop e iOS Safari con paginazione anti-taglio righe
window.exportPaginatedWorkoutPdf = async function({
  athleteName,
  durationWeeks,
  generalNotes,
  coachName,
  groupedDays,
  fileName
}) {
  const totalExercises = Object.values(groupedDays).reduce((acc, arr) => acc + arr.length, 0);

  document.getElementById("pdfAthlete").textContent = athleteName;
  document.getElementById("pdfDuration").textContent = `${durationWeeks} Settimane`;
  document.getElementById("pdfCount").textContent = totalExercises;
  document.getElementById("pdfDate").textContent = new Date().toLocaleDateString('it-IT');
  document.getElementById("pdfCoachTag").textContent = coachName ? `COACH: ${coachName.toUpperCase()}` : "COACH";
  document.getElementById("pdfFooterCoach").textContent = coachName ? `Preparatore: ${coachName}` : "Workout Builder";

  const notesBox = document.getElementById("pdfGeneralNotesBox");
  if (generalNotes) {
    notesBox.style.display = "block";
    document.getElementById("pdfGeneralNotesText").textContent = generalNotes;
  } else {
    notesBox.style.display = "none";
  }

  const tablesContainer = document.getElementById("pdfTablesContainer");
  tablesContainer.innerHTML = "";

  const theadHtml = `
    <thead>
      <tr>
        <th style="width: 24px;">#</th>
        <th style="width: 112px;">Esecuzione</th>
        <th>Esercizio</th>
        <th style="width: 82px;">Serie/Reps</th>
        <th style="width: 50px;">Rest</th>
        <th style="width: 56px;">RIR / @</th>
        <th style="width: 170px;">Note</th>
      </tr>
    </thead>
  `;

  Object.keys(groupedDays).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const daySection = document.createElement("div");
    daySection.className = "pdf-day-section";

    const dayTitle = document.createElement("div");
    dayTitle.className = "pdf-day-title";
    dayTitle.textContent = dayName;
    daySection.appendChild(dayTitle);

    const table = document.createElement("table");
    table.className = "pdf-table";
    table.innerHTML = `${theadHtml}<tbody></tbody>`;

    const tbody = table.querySelector("tbody");
    let inCircuit = false;

    groupedDays[dayName].forEach((item, index) => {
      const imgs = resolveExerciseImages(item.id, item.imgStart, item.imgEnd);
      const isSingle = imgs.imgStart === imgs.imgEnd;
      const isCircuitStart = item.circuitRole === "start" || item.circuitRole === "single";
      const isCircuitEnd = item.circuitRole === "end" || item.circuitRole === "single";

      if (isCircuitStart) {
        inCircuit = true;
        const label = item.circuitLabel ? item.circuitLabel : "CIRCUITO";
        const bannerTr = document.createElement("tr");
        bannerTr.dataset.keepWithNext = "true";
        bannerTr.innerHTML = `<td colspan="7" class="pdf-circuit-banner">🔄 INIZIO ${escapeHtml(label)}</td>`;
        tbody.appendChild(bannerTr);
      }

      const tr = document.createElement("tr");
      if (inCircuit) tr.className = "pdf-circuit-row";

      tr.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td style="white-space: nowrap;">
          ${imgs.imgStart ? (isSingle ? `
            <img src="${imgs.imgStart}" class="pdf-thumb">
          ` : `
            <img src="${imgs.imgStart}" class="pdf-thumb">
            <img src="${imgs.imgEnd}" class="pdf-thumb">
          `) : '-'}
        </td>
        <td>
          <strong>${escapeHtml(item.name)}</strong><br>
          <span style="font-size: 9px; color: #64748b;">${escapeHtml(item.muscle || "")}</span>
        </td>
        <td><strong>${escapeHtml(item.setsReps || "-")}</strong></td>
        <td>${escapeHtml(item.rest || "-")}</td>
        <td>${escapeHtml(item.rir || "-")}</td>
        <td style="font-size: 9.5px; white-space: pre-wrap;">${escapeHtml(item.notes || "-")}</td>
      `;
      tbody.appendChild(tr);

      if (isCircuitEnd && inCircuit) {
        tr.dataset.keepWithNext = "true";
        const endTr = document.createElement("tr");
        endTr.dataset.isCircuitEnd = "true";
        endTr.innerHTML = `<td colspan="7" class="pdf-circuit-end">🏁 FINE CIRCUITO</td>`;
        tbody.appendChild(endTr);
        inCircuit = false;
      }
    });

    daySection.appendChild(table);
    tablesContainer.appendChild(daySection);
  });

  const sourceSheet = document.getElementById("pdfSheet");

  const printHost = document.createElement("div");
  printHost.style.cssText = "position: absolute; top: 0; left: 0; width: 740px; min-width: 740px; margin: 0; padding: 0; background: #ffffff; z-index: 999999; -webkit-text-size-adjust: 100%; text-size-adjust: 100%;";

  const clonedSheet = sourceSheet.cloneNode(true);
  clonedSheet.style.cssText = "width: 740px; min-width: 740px; max-width: 740px; margin: 0; box-sizing: border-box; background: #ffffff; color: #0f172a; -webkit-text-size-adjust: 100%; text-size-adjust: 100%;";
  printHost.appendChild(clonedSheet);
  document.body.appendChild(printHost);

  const prevScrollX = window.scrollX;
  const prevScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const imgs = Array.from(clonedSheet.querySelectorAll("img"));
  await Promise.all(imgs.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => {
      img.onload = res;
      img.onerror = res;
    });
  }));
  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 150)));

  const PAGE_MAX_PX = 1044;
  const sheetTop = clonedSheet.getBoundingClientRect().top;
  const tablesTop = clonedSheet.querySelector("#pdfTablesContainer").getBoundingClientRect().top;
  let usedInCurrentPage = Math.max(0, tablesTop - sheetTop);

  function createPageBreakMarker() {
    const brk = document.createElement("div");
    brk.className = "html2pdf__page-break";
    brk.style.cssText = "height: 1px; width: 100%; page-break-before: always; break-before: page;";
    return brk;
  }

  const daySections = Array.from(clonedSheet.querySelectorAll(".pdf-day-section"));

  daySections.forEach(section => {
    const titleEl = section.querySelector(".pdf-day-title");
    const firstTable = section.querySelector(".pdf-table");
    if (!firstTable || !titleEl) return;

    const theadEl = firstTable.querySelector("thead");
    const theadHeight = theadEl ? theadEl.getBoundingClientRect().height : 26;
    const allRows = Array.from(firstTable.querySelectorAll("tbody tr"));
    if (allRows.length === 0) return;

    const titleStyle = window.getComputedStyle(titleEl);
    const titleTotalH = titleEl.getBoundingClientRect().height +
      (parseFloat(titleStyle.marginTop) || 0) +
      (parseFloat(titleStyle.marginBottom) || 0);

    let initialBlockH = allRows[0].getBoundingClientRect().height;
    if (allRows[0].dataset.keepWithNext === "true" && allRows[1]) {
      initialBlockH += allRows[1].getBoundingClientRect().height;
    }

    if (usedInCurrentPage > 40 && (usedInCurrentPage + titleTotalH + theadHeight + initialBlockH > PAGE_MAX_PX)) {
      section.insertBefore(createPageBreakMarker(), titleEl);
      usedInCurrentPage = titleTotalH + theadHeight;
    } else {
      usedInCurrentPage += titleTotalH + theadHeight;
    }

    let activeTable = firstTable;
    let activeTbody = firstTable.querySelector("tbody");

    for (let i = 0; i < allRows.length; i++) {
      const tr = allRows[i];
      if (tr.parentNode !== activeTbody) {
        activeTbody.appendChild(tr);
      }

      const rowH = tr.getBoundingClientRect().height;
      let neededH = rowH;
      if (tr.dataset.keepWithNext === "true" && allRows[i + 1]) {
        neededH += allRows[i + 1].getBoundingClientRect().height;
      }

      if (i > 0 && !tr.dataset.isCircuitEnd && usedInCurrentPage > 50 && (usedInCurrentPage + neededH > PAGE_MAX_PX)) {
        const brk = createPageBreakMarker();
        activeTable.parentNode.insertBefore(brk, activeTable.nextSibling);

        const nextTable = document.createElement("table");
        nextTable.className = "pdf-table";
        nextTable.style.marginTop = "0";
        nextTable.innerHTML = `${theadHtml}<tbody></tbody>`;

        brk.parentNode.insertBefore(nextTable, brk.nextSibling);
        activeTable = nextTable;
        activeTbody = nextTable.querySelector("tbody");
        activeTbody.appendChild(tr);

        usedInCurrentPage = theadHeight + rowH;
      } else {
        usedInCurrentPage += rowH;
      }
    }
  });

  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 120)));

  const opt = {
    margin: 5,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      x: 0,
      y: 0,
      width: 740,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 740
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['legacy'] }
  };

  try {
    await html2pdf().set(opt).from(clonedSheet).save();
  } finally {
    document.body.removeChild(printHost);
    window.scrollTo(prevScrollX, prevScrollY);
  }
};

async function savePdfSnapshotToHistory({ athleteId, athleteName, durationWeeks, generalNotes, items }) {
  if (!currentProfile || currentProfile.role !== "trainer") return;

  if (athleteId) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (parseInt(durationWeeks, 10) || 4) * 7);

    const { data: archivedWorkout, error } = await supabaseClient
      .from('workouts')
      .insert({
        trainer_id: currentProfile.id,
        athlete_id: athleteId,
        title: `PDF ${durationWeeks} Settimane`,
        general_notes: generalNotes,
        duration_weeks: parseInt(durationWeeks, 10) || 4,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'archived'
      })
      .select('id')
      .single();

    if (!error && archivedWorkout && items.length > 0) {
      const rows = items.map((ex, idx) => ({
        workout_id: archivedWorkout.id,
        exercise_id: ex.id,
        day_name: ex.day,
        sets_reps: ex.setsReps,
        rest: ex.rest,
        rir: ex.rir,
        notes: ex.notes,
        order_index: idx,
        circuit_role: ex.circuitRole || null,
        circuit_label: ex.circuitLabel || null
      }));
      await supabaseClient.from('workout_exercises').insert(rows);
    }
  } else {
    const { data: savedExt } = await supabaseClient
      .from('external_athlete_workouts')
      .insert({
        trainer_id: currentProfile.id,
        athlete_name: athleteName,
        duration_weeks: parseInt(durationWeeks, 10) || 4,
        general_notes: generalNotes || null,
        exercises_json: items.map(ex => ({
          id: ex.id,
          day: ex.day,
          name: ex.name,
          muscle: ex.muscle,
          imgStart: ex.imgStart,
          imgEnd: ex.imgEnd,
          setsReps: ex.setsReps,
          rest: ex.rest,
          rir: ex.rir,
          notes: ex.notes,
          circuitRole: ex.circuitRole || null,
          circuitLabel: ex.circuitLabel || ""
        }))
      })
      .select()
      .single();

    if (savedExt && typeof externalWorkoutsList !== "undefined") {
      externalWorkoutsList.unshift(savedExt);
    }
  }
}

// Generazione PDF Stampabile centrata su qualsiasi schermo (Desktop e iOS Safari)
document.getElementById("btnPdf").addEventListener("click", async () => {
  if (currentWorkout.length === 0) {
    alert("Inserisci almeno un esercizio prima di generare il PDF!");
    return;
  }

  const btn = document.getElementById("btnPdf");
  btn.disabled = true;
  btn.textContent = "⏳ Creazione PDF...";

  const athleteId = document.getElementById("builderAthleteSelect").value || null;
  const athleteName = document.getElementById("athleteName").value.trim() || "Atleta";
  const durationWeeks = document.getElementById("durationWeeks").value || "4";
  const generalNotes = document.getElementById("generalNotes").value.trim();

  const grouped = {};
  currentWorkout.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = [];
    grouped[item.day].push({
      id: item.id,
      name: item.name,
      muscle: item.muscle,
      imgStart: item.imgStart,
      imgEnd: item.imgEnd,
      setsReps: item.setsReps,
      rest: item.rest,
      rir: item.rir,
      notes: item.notes,
      circuitRole: item.circuitRole,
      circuitLabel: item.circuitLabel
    });
  });

  try {
    await savePdfSnapshotToHistory({
      athleteId,
      athleteName,
      durationWeeks,
      generalNotes,
      items: currentWorkout
    });

    await window.exportPaginatedWorkoutPdf({
      athleteName,
      durationWeeks,
      generalNotes,
      coachName: currentProfile ? currentProfile.full_name : "",
      groupedDays: grouped,
      fileName: `Scheda_${athleteName.replace(/\s+/g, '_')}.pdf`
    });
  } finally {
    btn.disabled = false;
    btn.textContent = "📄 Scarica PDF";
  }
});

syncSaveCloudButtonState();
