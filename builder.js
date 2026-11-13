const muscleFilter = document.getElementById("muscleFilter");
const exerciseSearch = document.getElementById("exerciseSearch");
const exerciseSelect = document.getElementById("exerciseSelect");
const exerciseSuggestions = document.getElementById("exerciseSuggestions");

async function loadExercisesFromCloud() {
  const { data, error } = await supabaseClient
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (!error && data) {
    EXERCISE_DB = data.map(row => ({
      id: row.id,
      name: row.name,
      muscle: row.muscle,
      imgStart: row.img_start,
      imgEnd: row.img_end
    }));
    document.getElementById("dbCount").textContent = `☁️ ${EXERCISE_DB.length} Esercizi`;
    updateSuggestions();
    updateDropdown();
  }
}

function updateSuggestions() {
  const selectedMuscle = muscleFilter.value;
  const pool = selectedMuscle === "ALL" ? EXERCISE_DB : EXERCISE_DB.filter(ex => ex.muscle === selectedMuscle);
  exerciseSuggestions.innerHTML = pool.map(e => `<option value="${e.name}"></option>`).join("");
}

function updateDropdown() {
  const selectedMuscle = muscleFilter.value;
  const term = exerciseSearch.value.trim().toLowerCase();
  const matches = EXERCISE_DB.filter(ex => {
    const matchMuscle = (selectedMuscle === "ALL" || ex.muscle === selectedMuscle);
    return matchMuscle && (term === "" || ex.name.toLowerCase().includes(term));
  }).slice(0, 60);

  if (matches.length === 0) {
    exerciseSelect.innerHTML = `<option value="">Nessun esercizio trovato</option>`;
    return;
  }
  exerciseSelect.innerHTML = matches.map(m => `<option value="${m.id}">[${m.muscle}] ${m.name}</option>`).join("");
  updatePreview();
}

function updatePreview() {
  const selected = EXERCISE_DB.find(e => e.id === exerciseSelect.value);
  if (!selected) return;
  const start = selected.imgStart || "";
  const end = selected.imgEnd || start;
  document.getElementById("previewImgStart").src = start;
  document.getElementById("previewImgEnd").src = end;
  document.getElementById("previewName").textContent = selected.name;
  document.getElementById("previewMuscle").textContent = selected.muscle;

  if (start === end) {
    document.getElementById("wrapImgEnd").style.display = "none";
    document.getElementById("previewImgStart").style.width = "110px";
    document.getElementById("previewImgStart").style.objectFit = "contain";
    document.getElementById("tagImgStart").textContent = "Movimento";
  } else {
    document.getElementById("wrapImgEnd").style.display = "flex";
    document.getElementById("previewImgStart").style.width = "62px";
    document.getElementById("previewImgStart").style.objectFit = "cover";
    document.getElementById("tagImgStart").textContent = "Partenza";
  }
}

exerciseSearch.addEventListener("input", updateDropdown);
muscleFilter.addEventListener("change", () => { updateSuggestions(); updateDropdown(); });
exerciseSelect.addEventListener("change", updatePreview);

document.getElementById("builderAthleteSelect").addEventListener("change", (e) => {
  const selected = trainerClients.find(c => c.id === e.target.value);
  if (selected) {
    document.getElementById("athleteName").value = selected.full_name;
    document.getElementById("btnLoadExistingWorkout").classList.remove("hidden");
  } else {
    document.getElementById("btnLoadExistingWorkout").classList.add("hidden");
  }
});

document.getElementById("btnLoadExistingWorkout").addEventListener("click", async () => {
  const athleteId = document.getElementById("builderAthleteSelect").value;
  if (!athleteId) return;

  const { data: workout } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!workout) {
    alert("Questo atleta non ha ancora una scheda attiva.");
    return;
  }

  document.getElementById("durationWeeks").value = workout.duration_weeks || 4;
  document.getElementById("generalNotes").value = workout.general_notes || "";

  const { data: items } = await supabaseClient
    .from('workout_exercises')
    .select('*, exercises(*)')
    .eq('workout_id', workout.id)
    .order('order_index', { ascending: true });

  if (items) {
    currentWorkout = items.map((row, idx) => ({
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
      notes: row.notes
    }));
    renderList();
  }
});

document.getElementById("btnAddEx").addEventListener("click", () => {
  const selected = EXERCISE_DB.find(e => e.id === exerciseSelect.value);
  if (!selected) return;

  currentWorkout.push({
    uid: Date.now(),
    id: selected.id,
    day: document.getElementById("exerciseDay").value,
    name: selected.name,
    muscle: selected.muscle,
    imgStart: selected.imgStart || "",
    imgEnd: selected.imgEnd || selected.imgStart || "",
    setsReps: document.getElementById("inSetsReps").value.trim() || "-",
    rest: document.getElementById("inRest").value.trim() || "-",
    rir: document.getElementById("inRir").value.trim() || "-",
    notes: document.getElementById("inNotes").value.trim() || "-"
  });

  document.getElementById("inNotes").value = "";
  renderList();
});

function renderList() {
  const list = document.getElementById("exerciseList");
  const btnClear = document.getElementById("btnClearBuilder");
  document.getElementById("counterLabel").textContent = `${currentWorkout.length} inseriti`;

  if (currentWorkout.length === 0) {
    if (btnClear) btnClear.classList.add("hidden");
    list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Nessun esercizio aggiunto</div>`;
    return;
  }

  if (btnClear) btnClear.classList.remove("hidden");

  const grouped = {};
  currentWorkout.forEach(ex => {
    if (!grouped[ex.day]) grouped[ex.day] = [];
    grouped[ex.day].push(ex);
  });

  list.innerHTML = "";
  Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const groupEl = document.createElement("div");
    groupEl.className = "day-group";
    groupEl.innerHTML = `<div class="day-badge">📅 ${dayName} (${grouped[dayName].length} esercizi)</div>`;

    grouped[dayName].forEach((ex, idx) => {
      const item = document.createElement("div");
      item.className = "exercise-item";
      item.innerHTML = `
        <div class="exercise-top">
          <div class="item-photos">
            ${ex.imgStart === ex.imgEnd ? `<img src="${ex.imgStart}" class="item-img" style="width: 82px; object-fit: contain;">` : `<img src="${ex.imgStart}" class="item-img"><img src="${ex.imgEnd}" class="item-img">`}
          </div>
          <div class="item-details">
            <strong>${idx + 1}. ${escapeHtml(ex.name)}</strong>
            <div class="item-sub"><strong>${escapeHtml(ex.setsReps)}</strong> | Rest: ${escapeHtml(ex.rest)} | RIR/@: ${escapeHtml(ex.rir)}</div>
            ${ex.notes !== '-' ? `<div class="item-notes">Note: ${escapeHtml(ex.notes)}</div>` : ''}
          </div>
          <button class="btn-del" onclick="deleteEx(${ex.uid})">✖</button>
        </div>
      `;
      groupEl.appendChild(item);
    });
    list.appendChild(groupEl);
  });
}

window.deleteEx = function(uid) {
  currentWorkout = currentWorkout.filter(e => e.uid !== uid);
  renderList();
};

document.getElementById("btnClearBuilder").addEventListener("click", () => {
  if (currentWorkout.length === 0) return;
  if (!confirm("Vuoi rimuovere tutti gli esercizi inseriti e ripartire da zero?")) return;

  currentWorkout = [];
  document.getElementById("generalNotes").value = "";
  renderList();
});

document.getElementById("btnSaveCloud").addEventListener("click", async () => {
  const athleteId = document.getElementById("builderAthleteSelect").value;
  if (!athleteId) {
    alert("Seleziona un atleta collegato dal menu a tendina in alto per inviare la scheda alla sua app.");
    return;
  }
  if (currentWorkout.length === 0) {
    alert("Aggiungi almeno un esercizio prima di salvare.");
    return;
  }

  const btn = document.getElementById("btnSaveCloud");
  btn.disabled = true;
  btn.textContent = "Salvataggio in corso...";

  const weeks = parseInt(document.getElementById("durationWeeks").value) || 4;
  const generalNotes = document.getElementById("generalNotes").value.trim();
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + (weeks * 7));

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
      duration_weeks: weeks,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      general_notes: generalNotes,
      status: 'active'
    })
    .select()
    .single();

  if (wError || !newWorkout) {
    alert("Errore salvataggio scheda: " + (wError ? wError.message : ""));
    btn.disabled = false;
    btn.textContent = "☁️ Salva e Invia all'app dell'Atleta";
    return;
  }

  const rowsToInsert = currentWorkout.map((ex, index) => ({
    workout_id: newWorkout.id,
    exercise_id: ex.id,
    day_name: ex.day,
    order_index: index,
    sets_reps: ex.setsReps,
    rest: ex.rest,
    rir: ex.rir,
    notes: ex.notes
  }));

  const { error: exError } = await supabaseClient
    .from('workout_exercises')
    .insert(rowsToInsert);

  btn.disabled = false;
  btn.textContent = "☁️ Salva e Invia all'app dell'Atleta";

  if (exError) {
    alert("Errore inserimento esercizi: " + exError.message);
  } else {
    alert("Scheda salvata e inviata con successo all'app dell'atleta!");
    currentWorkout = [];
    renderList();
    showTrainerView("trainerClientsView");
    loadTrainerClients();
  }
});

document.getElementById("btnPdf").addEventListener("click", () => {
  if (currentWorkout.length === 0) { alert("Aggiungi almeno un esercizio."); return; }
  const athlete = document.getElementById("athleteName").value.trim() || "Atleta";
  const weeks = document.getElementById("durationWeeks").value || "4";
  const generalNotes = document.getElementById("generalNotes").value.trim();

  document.getElementById("pdfCoachTag").textContent = `COACH: ${currentProfile.full_name.toUpperCase()}`;
  document.getElementById("pdfFooterCoach").textContent = `Coach ${currentProfile.full_name} • Workout Builder`;
  document.getElementById("pdfAthlete").textContent = athlete;
  document.getElementById("pdfDuration").textContent = `${weeks} settimane`;
  document.getElementById("pdfCount").textContent = currentWorkout.length;
  document.getElementById("pdfDate").textContent = new Date().toLocaleDateString("it-IT");

  const notesBox = document.getElementById("pdfGeneralNotesBox");
  if (generalNotes) {
    document.getElementById("pdfGeneralNotesText").textContent = generalNotes;
    notesBox.style.display = "block";
  } else {
    notesBox.style.display = "none";
  }

  const container = document.getElementById("pdfTablesContainer");
  container.innerHTML = "";
  const grouped = {};
  currentWorkout.forEach(ex => { if (!grouped[ex.day]) grouped[ex.day] = []; grouped[ex.day].push(ex); });

  Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const exercises = grouped[dayName];
    const dayTitle = document.createElement("div");
    dayTitle.className = "pdf-day-banner";
    dayTitle.innerHTML = `<span>${dayName}</span><span>${exercises.length} esercizi</span>`;
    container.appendChild(dayTitle);

    const table = document.createElement("table");
    table.className = "pdf-table";
    table.innerHTML = `
      <thead><tr><th style="width:96px;text-align:center;">Movimento</th><th>Esercizio</th><th style="width:95px;text-align:center;">Serie e Reps</th><th style="width:60px;text-align:center;">Rest</th><th style="width:70px;text-align:center;">RIR / @</th><th>Note</th></tr></thead>
      <tbody>
        ${exercises.map((ex, i) => `
          <tr>
            <td>${ex.imgStart === ex.imgEnd ? `<div style="display:flex;justify-content:center;"><img src="${ex.imgStart}" style="width:90px;height:50px;object-fit:contain;border:1px solid #cbd5e1;border-radius:4px;" crossorigin="anonymous"></div>` : `<div class="pdf-photos-wrap"><img src="${ex.imgStart}" class="pdf-img" crossorigin="anonymous"><img src="${ex.imgEnd}" class="pdf-img" crossorigin="anonymous"></div>`}</td>
            <td><strong>${i + 1}. ${escapeHtml(ex.name)}</strong></td>
            <td style="text-align:center;font-weight:bold;">${escapeHtml(ex.setsReps)}</td>
            <td style="text-align:center;">${escapeHtml(ex.rest)}</td>
            <td style="text-align:center;font-weight:600;">${escapeHtml(ex.rir)}</td>
            <td class="pdf-notes-cell">${escapeHtml(ex.notes)}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    container.appendChild(table);
  });

  const wrapper = document.getElementById("pdfPreviewWrapper");
  wrapper.style.display = "block";
  html2pdf().set({
    margin: [8, 8, 8, 8],
    filename: `Scheda_${athlete.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }).from(document.getElementById("pdfSheet")).save().then(() => { wrapper.style.display = "none"; });
});
