// =========================================================
// MODULO ANAMNESI & ATLETI ESTERNI (SOLO TRAINER)
// =========================================================

let trainerAnamnesisList = [];
let externalWorkoutsList = [];

document.getElementById("btnBackFromAnamnesis").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
  loadTrainerClients();
});

const btnBackFromExternalWorkouts = document.getElementById("btnBackFromExternalWorkouts");
if (btnBackFromExternalWorkouts) {
  btnBackFromExternalWorkouts.addEventListener("click", () => {
    showTrainerView("trainerClientsView");
    loadTrainerClients();
  });
}

document.getElementById("btnNewExternalAnamnesis").addEventListener("click", () => {
  openAnamnesisEditor({ athleteId: null, recordId: null, defaultName: "" });
});

document.getElementById("btnSaveAnamnesis").addEventListener("click", saveTrainerAnamnesis);

document.getElementById("btnDeleteAnamnesis").addEventListener("click", deleteTrainerAnamnesis);

document.getElementById("btnAnamnesisToBuilder").addEventListener("click", () => {
  const athleteId = document.getElementById("anamnesisAthleteId").value || "";
  const fullName = document.getElementById("anamFullName").value.trim();
  showTrainerView("trainerBuilderView");
  if (typeof loadTrainerDrafts === "function") loadTrainerDrafts();

  const selectEl = document.getElementById("builderAthleteSelect");
  const loadBtn = document.getElementById("btnLoadExistingWorkout");

  if (athleteId) {
    selectEl.value = athleteId;
    document.getElementById("athleteName").value = fullName;
    loadBtn.classList.remove("hidden");
  } else {
    selectEl.value = "";
    document.getElementById("athleteName").value = fullName;
    loadBtn.classList.add("hidden");
  }
  if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();
});

async function fetchTrainerAnamnesisAndExternalWorkouts() {
  const [{ data: allAnamnesis }, { data: extWorkouts }] = await Promise.all([
    supabaseClient
      .from('athlete_anamnesis')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .order('updated_at', { ascending: false }),
    supabaseClient
      .from('external_athlete_workouts')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .order('created_at', { ascending: false })
  ]);

  trainerAnamnesisList = allAnamnesis || [];
  externalWorkoutsList = extWorkouts || [];
}

function renderExternalAthletesList() {
  const container = document.getElementById("externalAnamnesisListContainer");
  if (!container) return;

  const externalRecords = (trainerAnamnesisList || []).filter(a => !a.athlete_id);
  const anamByNormName = new Map();
  externalRecords.forEach(rec => {
    const key = (rec.full_name || "").trim().toLowerCase();
    if (key && !anamByNormName.has(key)) anamByNormName.set(key, rec);
  });

  // Unisce gli atleti esterni con anamnesi + quelli per cui è stato generato almeno un PDF
  const externalAthletesMap = new Map();
  externalRecords.forEach(rec => {
    const key = (rec.full_name || "").trim().toLowerCase();
    if (!key) return;
    externalAthletesMap.set(key, {
      displayName: rec.full_name.trim(),
      anamnesis: rec,
      workouts: []
    });
  });

  (externalWorkoutsList || []).forEach(w => {
    const key = (w.athlete_name || "").trim().toLowerCase();
    if (!key) return;
    if (!externalAthletesMap.has(key)) {
      externalAthletesMap.set(key, {
        displayName: w.athlete_name.trim(),
        anamnesis: anamByNormName.get(key) || null,
        workouts: []
      });
    }
    externalAthletesMap.get(key).workouts.push(w);
  });

  const allExternal = Array.from(externalAthletesMap.values());

  if (allExternal.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Nessun atleta esterno ancora inserito.</div>`;
    return;
  }

  const term = (typeof trainerClientsSearchTerm !== "undefined") ? trainerClientsSearchTerm : "";
  const filtered = term
    ? allExternal.filter(item => {
        const rec = item.anamnesis;
        return (
          item.displayName.toLowerCase().includes(term) ||
          (rec && (rec.goal || "").toLowerCase().includes(term)) ||
          (rec && (rec.availability || "").toLowerCase().includes(term)) ||
          (rec && (rec.private_notes || "").toLowerCase().includes(term))
        );
      })
    : allExternal;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Nessun atleta esterno corrisponde a "${escapeHtml(term)}".</div>`;
    return;
  }

  container.innerHTML = "";
  filtered.forEach(item => {
    const rec = item.anamnesis;
    const workoutsCount = item.workouts.length;
    const subParts = [];
    if (rec && rec.goal) subParts.push(rec.goal);
    if (rec && rec.availability) subParts.push(rec.availability);
    const subLine = subParts.length > 0
      ? subParts.join(" • ")
      : (rec ? "Anamnesi compilata" : "Nessuna anamnesi compilata");

    const anamBtnHtml = rec
      ? `<button type="button" class="btn btn-outline btn-sm" style="border-color: var(--primary); color: var(--primary);" onclick="openExternalAnamnesis('${rec.id}')">🩺 Anamnesi</button>`
      : `<button type="button" class="btn btn-outline btn-sm" onclick="openNewAnamnesisForExternalName('${escapeJsAttr(item.displayName)}')">➕ Nuova Anamnesi</button>`;

    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div>
        <strong style="font-size: 0.92rem; display: block;">
          ${escapeHtml(item.displayName)}
          <span style="font-size: 0.68rem; background: rgba(59, 130, 246, 0.16); color: var(--primary); padding: 1px 6px; border-radius: 4px; margin-left: 4px;">Esterno</span>
        </strong>
        <span style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-top: 2px;">
          ${escapeHtml(subLine)}
        </span>
      </div>
      <div class="client-actions">
        ${anamBtnHtml}
        <button type="button" class="btn btn-outline btn-sm" onclick="viewExternalAthleteWorkouts('${escapeJsAttr(item.displayName)}')">📋 Schede (${workoutsCount})</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="openBuilderForExternal('${escapeJsAttr(item.displayName)}')">Crea Scheda</button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openNewAnamnesisForExternalName = function(externalName) {
  openAnamnesisEditor({
    athleteId: null,
    recordId: null,
    defaultName: externalName,
    record: null
  });
};

window.openClientAnamnesis = async function(clientId, clientName) {
  let existing = (trainerAnamnesisList || []).find(a => a.athlete_id === clientId) || null;
  if (!existing) {
    const { data } = await supabaseClient
      .from('athlete_anamnesis')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .maybeSingle();
    existing = data || null;
  }

  openAnamnesisEditor({
    athleteId: clientId,
    recordId: existing ? existing.id : null,
    defaultName: clientName,
    record: existing
  });
};

window.openExternalAnamnesis = async function(recordId) {
  let existing = (trainerAnamnesisList || []).find(a => a.id === recordId) || null;
  if (!existing) {
    const { data } = await supabaseClient
      .from('athlete_anamnesis')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .eq('id', recordId)
      .single();
    existing = data || null;
  }

  if (!existing) {
    alert("Anamnesi non trovata.");
    return;
  }

  openAnamnesisEditor({
    athleteId: null,
    recordId: existing.id,
    defaultName: existing.full_name,
    record: existing
  });
};

function openAnamnesisEditor({ athleteId = null, recordId = null, defaultName = "", record = null }) {
  showTrainerView("trainerAnamnesisView");

  const titleEl = document.getElementById("anamnesisViewTitle");
  const subtitleEl = document.getElementById("anamnesisViewSubtitle");
  const deleteBtn = document.getElementById("btnDeleteAnamnesis");
  const secondaryActionsEl = document.getElementById("anamnesisSecondaryActions");
  const metaEl = document.getElementById("anamnesisUpdatedMeta");
  const nameInput = document.getElementById("anamFullName");

  document.getElementById("anamnesisRecordId").value = record ? record.id : (recordId || "");
  document.getElementById("anamnesisAthleteId").value = athleteId || "";

  if (athleteId) {
    titleEl.textContent = `🩺 Anamnesi: ${defaultName}`;
    subtitleEl.textContent = "Scheda privata riservata al coach • Atleta collegato all'app";
    nameInput.value = record && record.full_name ? record.full_name : defaultName;
  } else {
    titleEl.textContent = record ? `🩺 Anamnesi: ${record.full_name}` : "🩺 Nuova Anamnesi (Atleta Esterno)";
    subtitleEl.textContent = "Scheda privata riservata al coach • Atleta esterno";
    nameInput.value = record ? record.full_name : defaultName;
  }

  document.getElementById("anamBirthDate").value = record && record.birth_date ? record.birth_date : "";
  document.getElementById("anamGender").value = record && record.gender ? record.gender : "";
  document.getElementById("anamHeightCm").value = record && record.height_cm !== null && record.height_cm !== undefined ? record.height_cm : "";
  document.getElementById("anamWeightKg").value = record && record.weight_kg !== null && record.weight_kg !== undefined ? record.weight_kg : "";
  document.getElementById("anamOccupation").value = record && record.occupation ? record.occupation : "";
  document.getElementById("anamAvailability").value = record && record.availability ? record.availability : "";
  document.getElementById("anamGoal").value = record && record.goal ? record.goal : "";
  document.getElementById("anamInjuries").value = record && record.injuries ? record.injuries : "";
  document.getElementById("anamExperience").value = record && record.experience ? record.experience : "";
  document.getElementById("anamPrivateNotes").value = record && record.private_notes ? record.private_notes : "";

  if (record && record.updated_at) {
    const dt = new Date(record.updated_at).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    metaEl.textContent = `Ultimo aggiornamento: ${dt}`;
    deleteBtn.classList.remove("hidden");
    if (secondaryActionsEl) {
      secondaryActionsEl.className = "grid-2";
      secondaryActionsEl.style.cssText = "";
    }
  } else {
    metaEl.textContent = "Compila i campi e premi Salva Anamnesi.";
    deleteBtn.classList.add("hidden");
    if (secondaryActionsEl) {
      secondaryActionsEl.className = "";
      secondaryActionsEl.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
    }
  }
}

async function saveTrainerAnamnesis() {
  const fullName = document.getElementById("anamFullName").value.trim();
  if (!fullName) {
    alert("Inserisci il Nome e Cognome dell'atleta.");
    return;
  }

  const btn = document.getElementById("btnSaveAnamnesis");
  btn.disabled = true;
  btn.textContent = "Salvataggio...";

  const recordId = document.getElementById("anamnesisRecordId").value.trim() || null;
  const athleteId = document.getElementById("anamnesisAthleteId").value.trim() || null;

  const heightRaw = document.getElementById("anamHeightCm").value.trim();
  const weightRaw = document.getElementById("anamWeightKg").value.trim();

  const payload = {
    trainer_id: currentProfile.id,
    athlete_id: athleteId,
    full_name: fullName,
    birth_date: document.getElementById("anamBirthDate").value || null,
    gender: document.getElementById("anamGender").value || null,
    height_cm: heightRaw ? parseFloat(heightRaw) : null,
    weight_kg: weightRaw ? parseFloat(weightRaw) : null,
    occupation: document.getElementById("anamOccupation").value.trim() || null,
    availability: document.getElementById("anamAvailability").value.trim() || null,
    goal: document.getElementById("anamGoal").value.trim() || null,
    injuries: document.getElementById("anamInjuries").value.trim() || null,
    experience: document.getElementById("anamExperience").value.trim() || null,
    private_notes: document.getElementById("anamPrivateNotes").value.trim() || null,
    updated_at: new Date().toISOString()
  };

  let savedData = null;
  let error = null;

  if (recordId) {
    const res = await supabaseClient
      .from('athlete_anamnesis')
      .update(payload)
      .eq('id', recordId)
      .eq('trainer_id', currentProfile.id)
      .select()
      .single();
    savedData = res.data;
    error = res.error;
  } else {
    const res = await supabaseClient
      .from('athlete_anamnesis')
      .insert(payload)
      .select()
      .single();
    savedData = res.data;
    error = res.error;
  }

  btn.disabled = false;
  btn.textContent = "💾 Salva Anamnesi";

  if (error || !savedData) {
    alert("Errore salvataggio anamnesi: " + (error ? error.message : "sconosciuto"));
    return;
  }

  const idx = trainerAnamnesisList.findIndex(a => a.id === savedData.id);
  if (idx >= 0) {
    trainerAnamnesisList[idx] = savedData;
  } else {
    trainerAnamnesisList.unshift(savedData);
  }

  openAnamnesisEditor({
    athleteId: savedData.athlete_id,
    recordId: savedData.id,
    defaultName: savedData.full_name,
    record: savedData
  });

  alert("✅ Scheda anamnesi salvata!");
}

async function deleteTrainerAnamnesis() {
  const recordId = document.getElementById("anamnesisRecordId").value.trim();
  if (!recordId) return;

  if (!confirm("Vuoi eliminare definitivamente questa scheda anamnesi?")) return;

  const { error } = await supabaseClient
    .from('athlete_anamnesis')
    .delete()
    .eq('id', recordId)
    .eq('trainer_id', currentProfile.id);

  if (error) {
    alert("Errore durante l'eliminazione: " + error.message);
    return;
  }

  trainerAnamnesisList = trainerAnamnesisList.filter(a => a.id !== recordId);
  showTrainerView("trainerClientsView");
  await loadTrainerClients();
}

window.openBuilderForExternal = function(externalName) {
  showTrainerView("trainerBuilderView");
  if (typeof loadTrainerDrafts === "function") loadTrainerDrafts();
  document.getElementById("builderAthleteSelect").value = "";
  document.getElementById("athleteName").value = externalName;
  document.getElementById("btnLoadExistingWorkout").classList.add("hidden");
  if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();
};

// --- STORICO SCHEDE PDF ATLETI ESTERNI (PER DATA) ---
window.viewExternalAthleteWorkouts = async function(athleteName) {
  showTrainerView("trainerExternalWorkoutsView");
  document.getElementById("externalWorkoutsTitle").textContent = `📋 Schede: ${athleteName}`;
  const container = document.getElementById("externalWorkoutsHistoryContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento storico schede...</div>`;

  const { data, error } = await supabaseClient
    .from('external_athlete_workouts')
    .select('*')
    .eq('trainer_id', currentProfile.id)
    .ilike('athlete_name', athleteName.trim())
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.84rem;">Errore: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda PDF ancora salvata per ${escapeHtml(athleteName)}.</div>`;
    return;
  }

  container.innerHTML = "";
  data.forEach((w, idx) => {
    const dateStr = new Date(w.created_at).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const items = Array.isArray(w.exercises_json) ? w.exercises_json : [];

    const grouped = {};
    items.forEach(item => {
      const dayKey = item.day || "Giorno 1";
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(item);
    });

    const daysHtml = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(dayName => {
        const dayItems = grouped[dayName];
        const rowsHtml = dayItems.map((row, rIdx) => `
          <div class="exercise-item">
            <div class="exercise-top">
              <div class="item-details">
                <strong>${rIdx + 1}. ${escapeHtml(row.name || 'Esercizio')}</strong>
                <div class="item-sub"><strong>${escapeHtml(row.setsReps || '-')}</strong> | Rest: ${escapeHtml(row.rest || '-')} | RIR/@: ${escapeHtml(row.rir || '-')}</div>
                ${row.notes && row.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(row.notes)}</div>` : ''}
              </div>
            </div>
          </div>
        `).join("");

        return `
          <div class="day-group" style="margin-top: 8px;">
            <div class="day-badge">📅 ${escapeHtml(dayName)} (${dayItems.length} ESERCIZI)</div>
            ${rowsHtml}
          </div>
        `;
      }).join("");

    const box = document.createElement("div");
    box.style.cssText = `background: var(--subcard-bg); color: var(--text); border: 1.5px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 12px; margin-bottom: 12px;`;
    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
        <div>
          <span class="status-badge ${idx === 0 ? 'status-active' : 'status-none'}" style="margin-top: 0; margin-bottom: 4px;">
            ${idx === 0 ? '● ULTIMA SCHEDA' : `SCHEDA #${data.length - idx}`}
          </span>
          <div style="font-size: 0.84rem; color: var(--text); font-weight: 700;">
            📅 ${dateStr} • Durata: ${w.duration_weeks} sett.
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="cloneExternalWorkoutToBuilder('${w.id}')">
            📥 Carica nel Builder
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="redownloadExternalWorkoutPdf('${w.id}')">
            📄 PDF
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteExternalWorkout('${w.id}', '${escapeJsAttr(athleteName)}')">
            🗑️
          </button>
        </div>
      </div>

      ${w.general_notes ? `<div style="background: var(--notes-bg); color: var(--notes-text); border: 1px solid var(--border); padding: 7px 9px; border-radius: 6px; font-size: 0.8rem; margin-top: 8px; white-space: pre-wrap;"><strong>Note generali:</strong> ${escapeHtml(w.general_notes)}</div>` : ''}

      <details ${idx === 0 ? 'open' : ''} style="margin-top: 8px;">
        <summary style="cursor: pointer; font-size: 0.82rem; color: var(--primary); font-weight: 700;">
          Mostra esercizi (${items.length})
        </summary>
        <div class="exercise-list" style="margin-top: 6px;">
          ${items.length > 0 ? daysHtml : '<span style="font-size: 0.8rem; color: var(--text-muted);">Nessun esercizio salvato.</span>'}
        </div>
      </details>
    `;
    container.appendChild(box);
  });
};

window.cloneExternalWorkoutToBuilder = async function(extWorkoutId) {
  const { data: w, error } = await supabaseClient
    .from('external_athlete_workouts')
    .select('*')
    .eq('id', extWorkoutId)
    .single();

  if (error || !w) {
    alert("Errore nel caricamento della scheda.");
    return;
  }

  if (typeof currentDraftId !== "undefined") currentDraftId = null;
  openBuilderForExternal(w.athlete_name);
  document.getElementById("durationWeeks").value = w.duration_weeks || 4;
  document.getElementById("generalNotes").value = w.general_notes || "";

  const items = Array.isArray(w.exercises_json) ? w.exercises_json : [];
  currentWorkout = items.map((row, idx) => {
    const base = {
      uid: Date.now() + idx,
      id: row.id,
      day: row.day || "Giorno 1",
      name: row.name || "Esercizio",
      muscle: row.muscle || "",
      imgStart: row.imgStart || "",
      imgEnd: row.imgEnd || row.imgStart || "",
      setsReps: row.setsReps || "-",
      rest: row.rest || "-",
      rir: row.rir || "-",
      notes: row.notes || "-",
      circuitRole: row.circuitRole || null,
      circuitLabel: row.circuitLabel || "",
      weeklyProgression: null
    };
    // Mantiene la progressione settimanale delle schede mesociclo salvate
    base.weeklyProgression = typeof normalizeWeeklyProgression === "function"
      ? normalizeWeeklyProgression(row.weeklyProgression, base)
      : null;
    return base;
  });

  if (typeof applyProgrammingModeFromItems === "function") {
    applyProgrammingModeFromItems(w.duration_weeks);
  }
  renderList();
};

window.redownloadExternalWorkoutPdf = async function(extWorkoutId) {
  const { data: w, error } = await supabaseClient
    .from('external_athlete_workouts')
    .select('*')
    .eq('id', extWorkoutId)
    .single();

  if (error || !w) {
    alert("Errore nel recupero della scheda.");
    return;
  }

  const items = Array.isArray(w.exercises_json) ? w.exercises_json : [];
  const grouped = {};
  items.forEach(item => {
    const dayKey = item.day || "Giorno 1";
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push({
      name: item.name,
      muscle: item.muscle,
      imgStart: item.imgStart,
      imgEnd: item.imgEnd,
      setsReps: item.setsReps,
      rest: item.rest,
      rir: item.rir,
      notes: item.notes,
      circuitRole: item.circuitRole,
      circuitLabel: item.circuitLabel,
      weeklyProgression: item.weeklyProgression || null
    });
  });

  await window.exportPaginatedWorkoutPdf({
    athleteName: w.athlete_name,
    durationWeeks: w.duration_weeks || 4,
    generalNotes: w.general_notes || "",
    coachName: currentProfile ? currentProfile.full_name : "",
    groupedDays: grouped,
    fileName: `Scheda_${w.athlete_name.replace(/\s+/g, '_')}.pdf`
  });
};

window.deleteExternalWorkout = async function(extWorkoutId, athleteName) {
  if (!confirm("Vuoi eliminare questa scheda dallo storico?")) return;

  const { error } = await supabaseClient
    .from('external_athlete_workouts')
    .delete()
    .eq('id', extWorkoutId)
    .eq('trainer_id', currentProfile.id);

  if (error) {
    alert("Errore eliminazione: " + error.message);
    return;
  }

  externalWorkoutsList = externalWorkoutsList.filter(w => w.id !== extWorkoutId);
  await viewExternalAthleteWorkouts(athleteName);
};
