const muscleFilter = document.getElementById("muscleFilter");
const exerciseSearch = document.getElementById("exerciseSearch");
const exerciseSuggestions = document.getElementById("exerciseSuggestions");
const exerciseSelect = document.getElementById("exerciseSelect");
const exerciseDaySelect = document.getElementById("exerciseDay");
const chkCircuitStart = document.getElementById("chkCircuitStart");
const chkCircuitEnd = document.getElementById("chkCircuitEnd");
const circuitLabelWrap = document.getElementById("circuitLabelWrap");
const inCircuitLabel = document.getElementById("inCircuitLabel");

let currentDraftId = null;
let editingItemUid = null;
let searchDebounceTimer = null;

if (exerciseSearch) {
  exerciseSearch.removeAttribute("list");
}
if (exerciseSuggestions) {
  exerciseSuggestions.innerHTML = "";
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

async function loadExercisesFromCloud() {
  const { data, error } = await supabaseClient
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (!error && data) {
    EXERCISE_DB = data;
    document.getElementById("dbCount").textContent = `${EXERCISE_DB.length} esercizi`;
    populateDropdown();
  }
  syncCircuitCheckboxes();
}

async function loadTrainerDrafts() {
  if (!currentProfile || currentProfile.role !== 'trainer') return;

  const { data: drafts, error } = await supabaseClient
    .from('workouts')
    .select('*, workout_exercises(count)')
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
      .select('*, workout_exercises(*, exercises(*))')
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

    document.getElementById("durationWeeks").value = workout.duration_weeks || 4;
    document.getElementById("generalNotes").value = workout.general_notes || "";

    const sortedItems = (workout.workout_exercises || []).sort((a, b) => a.order_index - b.order_index);
    currentWorkout = sortedItems.map((row, idx) => {
      const exFromDb = row.exercises || (typeof EXERCISE_DB !== "undefined" ? EXERCISE_DB.find(e => e.id === row.exercise_id) : null);
      return {
        uid: Date.now() + idx,
        id: row.exercise_id,
        day: row.day_name,
        name: exFromDb ? exFromDb.name : "Esercizio",
        muscle: exFromDb ? exFromDb.muscle : "",
        imgStart: exFromDb ? exFromDb.img_start : "",
        imgEnd: exFromDb ? (exFromDb.img_end || exFromDb.img_start) : "",
        setsReps: row.sets_reps,
        rest: row.rest,
        rir: row.rir,
        notes: row.notes,
        circuitRole: row.circuit_role || null,
        circuitLabel: row.circuit_label || ""
      };
    });

    renderList();
    await loadTrainerDrafts();
  } catch (err) {
    console.error("Errore resumeDraft:", err);
    alert("Impossibile riprendere la bozza: " + err.message);
  }
};

window.deleteDraft = async function(draftId) {
  if (!confirm("Eliminare questa bozza?")) return;

  await supabaseClient.from('workout_exercises').delete().eq('workout_id', draftId);
  await supabaseClient.from('workouts').delete().eq('id', draftId).eq('trainer_id', currentProfile.id);

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

  const athleteId = document.getElementById("builderAthleteSelect").value || null;
  const pdfName = document.getElementById("athleteName").value.trim();
  const durationWeeks = parseInt(document.getElementById("durationWeeks").value) || 4;
  const generalNotes = document.getElementById("generalNotes").value.trim();

  let targetWorkoutId = currentDraftId;

  if (targetWorkoutId) {
    const { error: uErr } = await supabaseClient
      .from('workouts')
      .update({
        athlete_id: athleteId,
        title: pdfName || "Bozza Scheda",
        general_notes: generalNotes,
        duration_weeks: durationWeeks
      })
      .eq('id', targetWorkoutId)
      .eq('trainer_id', currentProfile.id);

    if (uErr) {
      alert("Errore aggiornamento bozza: " + uErr.message);
      btn.disabled = false;
      btn.textContent = "📝 Salva Bozza";
      return;
    }

    await supabaseClient.from('workout_exercises').delete().eq('workout_id', targetWorkoutId);
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
      .select()
      .single();

    if (cErr || !createdDraft) {
      alert("Errore salvataggio bozza: " + (cErr ? cErr.message : "sconosciuto"));
      btn.disabled = false;
      btn.textContent = "📝 Salva Bozza";
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

  btn.disabled = false;
  btn.textContent = "📝 Salva Bozza";

  if (exError) {
    alert("Bozza salvata ma errore sugli esercizi: " + exError.message);
  } else {
    alert("📝 Bozza salvata! Puoi chiudere l'app e riprenderla quando vuoi.");
    loadTrainerDrafts();
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
});

document.getElementById("btnLoadExistingWorkout").addEventListener("click", async () => {
  const athleteId = document.getElementById("builderAthleteSelect").value;
  if (!athleteId) return;

  const btn = document.getElementById("btnLoadExistingWorkout");
  btn.disabled = true;
  btn.textContent = "Caricamento...";

  const { data: workout, error } = await supabaseClient
    .from('workouts')
    .select('*, workout_exercises(*, exercises(*))')
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
  currentWorkout = sortedItems.map((row, idx) => ({
    uid: Date.now() + idx,
    id: row.exercise_id,
    day: row.day_name,
    name: row.exercises ? row.exercises.name : "Esercizio",
    muscle: row.exercises ? row.exercises.muscle : "",
    imgStart: row.exercises ? row.exercises.img_start : "",
    imgEnd: row.exercises ? (row.exercises.img_end || row.exercises.img_start) : "",
    setsReps: row.sets_reps,
    rest: row.rest,
    rir: row.rir,
    notes: row.notes,
    circuitRole: row.circuit_role || null,
    circuitLabel: row.circuit_label || ""
  }));

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
    const matchMuscle = filter === "ALL" || ex.muscle === filter;
    const matchSearch = !search || ex.name.toLowerCase().includes(search);
    return matchMuscle && matchSearch;
  });

  if (filtered.length === 0) {
    exerciseSelect.innerHTML = `<option value="">Nessun esercizio trovato</option>`;
    return;
  }

  exerciseSelect.innerHTML = filtered
    .map(ex => `<option value="${ex.id}">${escapeHtml(ex.name)} (${escapeHtml(ex.muscle)})</option>`)
    .join("");

  updatePreview();
}

function updatePreview() {
  const selected = EXERCISE_DB.find(ex => ex.id === exerciseSelect.value);
  if (!selected) return;

  const startSrc = selected.img_start;
  const endSrc = selected.img_end || selected.img_start;
  const isSingle = startSrc === endSrc;

  const imgStartEl = document.getElementById("previewImgStart");
  const wrapEndEl = document.getElementById("wrapImgEnd");
  const tagStartEl = document.getElementById("tagImgStart");

  imgStartEl.src = startSrc;
  document.getElementById("previewName").textContent = selected.name;
  document.getElementById("previewMuscle").textContent = selected.muscle;

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
    document.getElementById("previewImgEnd").src = endSrc;
  }
}

muscleFilter.addEventListener("change", populateDropdown);

exerciseSearch.addEventListener("input", () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(populateDropdown, 120);
});

exerciseSelect.addEventListener("change", updatePreview);

document.getElementById("btnAddEx").addEventListener("click", () => {
  const selected = EXERCISE_DB.find(ex => ex.id === exerciseSelect.value);
  if (!selected) return;

  const isStart = chkCircuitStart.checked && !chkCircuitStart.disabled;
  const isEnd = chkCircuitEnd.checked && !chkCircuitEnd.disabled;
  let circuitRole = null;
  if (isStart) circuitRole = "start";
  else if (isEnd) circuitRole = "end";

  currentWorkout.push({
    uid: Date.now(),
    id: selected.id,
    day: exerciseDaySelect.value,
    name: selected.name,
    muscle: selected.muscle,
    imgStart: selected.img_start,
    imgEnd: selected.img_end || selected.img_start,
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
  const isSingle = item.imgStart === item.imgEnd;
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
          ${isSingle ? `
            <img src="${item.imgStart}" class="item-img" style="width: 82px; object-fit: contain;">
          ` : `
            <img src="${item.imgStart}" class="item-img">
            <img src="${item.imgEnd}" class="item-img">
          `}
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

  const durationWeeks = parseInt(document.getElementById("durationWeeks").value) || 4;
  const generalNotes = document.getElementById("generalNotes").value.trim();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + (durationWeeks * 7));

  await supabaseClient
    .from('workouts')
    .update({ status: 'archived' })
    .eq('athlete_id', athleteId)
    .eq('status', 'active');

  const { data: newWorkout, error: wError } = await supabaseClient
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
    .select()
    .single();

  if (wError || !newWorkout) {
    alert("Errore salvataggio scheda: " + (wError ? wError.message : "sconosciuto"));
    btn.disabled = false;
    btn.textContent = "☁️ Salva e Invia all'app dell'Atleta";
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

  btn.disabled = false;
  btn.textContent = "☁️ Salva e Invia all'app dell'Atleta";

  if (exError) {
    alert("Scheda creata ma errore negli esercizi: " + exError.message);
  } else {
    if (currentDraftId) {
      await supabaseClient.from('workout_exercises').delete().eq('workout_id', currentDraftId);
      await supabaseClient.from('workouts').delete().eq('id', currentDraftId);
      currentDraftId = null;
    }

    alert("✅ Scheda salvata e inviata! L'atleta la vedrà immediatamente aprendo la sua app.");
    currentWorkout = [];
    editingItemUid = null;
    renderList();
    showTrainerView("trainerClientsView");
    loadTrainerClients();
  }
});

// Generazione PDF Stampabile centrata su Desktop e iOS Safari con spaziatura anti-taglio righe
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
      const isSingle = item.imgStart === item.imgEnd;
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
          ${item.imgStart ? (isSingle ? `
            <img src="${item.imgStart}" class="pdf-thumb">
          ` : `
            <img src="${item.imgStart}" class="pdf-thumb">
            <img src="${item.imgEnd}" class="pdf-thumb">
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
        const endTr = document.createElement("tr");
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

  // Passo di taglio reale di html2pdf con width=740px e margin=5mm (calibrato per evitare deriva su 3+ pagine)
  const PAGE_SLOT_PX = 1020;
  const SAFE_BOTTOM_MARGIN = 16;

  const daySections = Array.from(clonedSheet.querySelectorAll(".pdf-day-section"));

  daySections.forEach(section => {
    const titleEl = section.querySelector(".pdf-day-title");
    const firstTable = section.querySelector(".pdf-table");
    if (!firstTable || !titleEl) return;

    const theadEl = firstTable.querySelector("thead");
    const theadHeight = theadEl ? theadEl.getBoundingClientRect().height : 26;
    const allRows = Array.from(firstTable.querySelectorAll("tbody tr"));
    if (allRows.length === 0) return;

    const sheetTop = clonedSheet.getBoundingClientRect().top;
    const titleRect = titleEl.getBoundingClientRect();
    let initialBlockHeight = allRows[0].getBoundingClientRect().height;
    if (allRows[0].dataset.keepWithNext === "true" && allRows[1]) {
      initialBlockHeight += allRows[1].getBoundingClientRect().height;
    }

    const titlePosInSlot = (titleRect.top - sheetTop) % PAGE_SLOT_PX;
    if (titlePosInSlot > 30 && (titlePosInSlot + titleRect.height + theadHeight + initialBlockHeight > PAGE_SLOT_PX - SAFE_BOTTOM_MARGIN)) {
      const spacerH = Math.ceil(PAGE_SLOT_PX - titlePosInSlot);
      const spacer = document.createElement("div");
      spacer.style.cssText = `height: ${spacerH}px; width: 100%; background: #ffffff;`;
      section.insertBefore(spacer, titleEl);
    }

    let activeTable = firstTable;
    let activeTbody = firstTable.querySelector("tbody");

    for (let i = 1; i < allRows.length; i++) {
      const tr = allRows[i];
      if (tr.parentNode !== activeTbody) {
        activeTbody.appendChild(tr);
      }

      const currentSheetTop = clonedSheet.getBoundingClientRect().top;
      const trRect = tr.getBoundingClientRect();
      const posInSlot = (trRect.top - currentSheetTop) % PAGE_SLOT_PX;

      let neededH = trRect.height;
      if (tr.dataset.keepWithNext === "true" && allRows[i + 1]) {
        neededH += allRows[i + 1].getBoundingClientRect().height;
      }

      if (posInSlot > 40 && (posInSlot + neededH > PAGE_SLOT_PX - SAFE_BOTTOM_MARGIN)) {
        const spacerH = Math.ceil(PAGE_SLOT_PX - posInSlot);
        const spacer = document.createElement("div");
        spacer.style.cssText = `height: ${spacerH}px; width: 100%; background: #ffffff;`;
        activeTable.parentNode.insertBefore(spacer, activeTable.nextSibling);

        const nextTable = document.createElement("table");
        nextTable.className = "pdf-table";
        nextTable.style.marginTop = "0";
        nextTable.innerHTML = `${theadHtml}<tbody></tbody>`;

        spacer.parentNode.insertBefore(nextTable, spacer.nextSibling);
        activeTable = nextTable;
        activeTbody = nextTable.querySelector("tbody");
        activeTbody.appendChild(tr);
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
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(clonedSheet).save();
  } finally {
    document.body.removeChild(printHost);
    window.scrollTo(prevScrollX, prevScrollY);
  }
};

// Generazione PDF Stampabile centrata su qualsiasi schermo (Desktop e iOS Safari)
document.getElementById("btnPdf").addEventListener("click", async () => {
  if (currentWorkout.length === 0) {
    alert("Inserisci almeno un esercizio prima di generare il PDF!");
    return;
  }

  const btn = document.getElementById("btnPdf");
  btn.disabled = true;
  btn.textContent = "⏳ Creazione PDF...";

  const athleteName = document.getElementById("athleteName").value.trim() || "Atleta";
  const durationWeeks = document.getElementById("durationWeeks").value || "4";
  const generalNotes = document.getElementById("generalNotes").value.trim();

  const grouped = {};
  currentWorkout.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = [];
    grouped[item.day].push({
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
