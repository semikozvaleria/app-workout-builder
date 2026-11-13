function renderAthleteLogSummary(exLogs) {
  if (!exLogs || exLogs.length === 0) {
    return `<div class="last-log-tag">📝 Registra il tuo allenamento:</div>`;
  }

  const latest = exLogs[0];
  const latestDate = new Date(latest.logged_at).toLocaleDateString('it-IT');
  const rirTxt = (latest.rir !== null && latest.rir !== undefined) ? ` • RIR/@: ${latest.rir}` : '';

  const olderHtml = exLogs.length > 1 ? `
    <details class="past-logs-details">
      <summary>Vedi storico sessioni (${exLogs.length - 1})</summary>
      <div style="margin-top: 4px;">
        ${exLogs.slice(1).map(old => {
          const d = new Date(old.logged_at).toLocaleDateString('it-IT');
          const r = (old.rir !== null && old.rir !== undefined) ? ` • RIR/@: ${old.rir}` : '';
          const n = old.athlete_notes ? `\n"${escapeHtml(old.athlete_notes)}"` : '';
          return `<div class="past-log-line"><strong>${d}:</strong> ${old.weight_kg ?? '-'} kg × ${escapeHtml(old.reps_done || '-')}${r}${n}</div>`;
        }).join("")}
      </div>
    </details>
  ` : "";

  return `
    <div class="last-log-tag">
      ✅ Ultimo (${latestDate}): ${latest.weight_kg ?? '-'} kg × ${escapeHtml(latest.reps_done || '-')}${rirTxt}
    </div>
    ${latest.athlete_notes ? `<div class="feedback-note">"${escapeHtml(latest.athlete_notes)}"</div>` : ''}
    ${olderHtml}
  `;
}

async function initAthleteArea() {
  if (!currentProfile.trainer_id) {
    document.getElementById("athleteLinkCoachCard").classList.remove("hidden");
    document.getElementById("athleteWorkoutCard").classList.add("hidden");
    return;
  }

  document.getElementById("athleteLinkCoachCard").classList.add("hidden");
  document.getElementById("athleteWorkoutCard").classList.remove("hidden");

  const { data: coach } = await supabaseClient
    .from('profiles')
    .select('full_name, logo_url')
    .eq('id', currentProfile.trainer_id)
    .single();

  if (coach) {
    document.getElementById("athleteCoachName").textContent = `Coach: ${coach.full_name}`;
    applyBrandLogo(coach.logo_url);
  }

  const { data: workout } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('athlete_id', currentProfile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const container = document.getElementById("athleteExercisesContainer");

  if (!workout) {
    document.getElementById("athleteWorkoutMeta").textContent = "Nessuna scheda attiva assegnata al momento.";
    document.getElementById("athleteGeneralNotes").classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  const endStr = workout.end_date ? new Date(workout.end_date).toLocaleDateString('it-IT') : '-';
  document.getElementById("athleteWorkoutMeta").textContent = `Durata: ${workout.duration_weeks} settimane • Scadenza: ${endStr}`;
  
  if (workout.general_notes) {
    document.getElementById("athleteGeneralNotes").textContent = "NOTE DEL COACH:\n" + workout.general_notes;
    document.getElementById("athleteGeneralNotes").classList.remove("hidden");
  } else {
    document.getElementById("athleteGeneralNotes").classList.add("hidden");
  }

  const { data: items } = await supabaseClient
    .from('workout_exercises')
    .select('*, exercises(*)')
    .eq('workout_id', workout.id)
    .order('order_index', { ascending: true });

  const { data: myLogs } = await supabaseClient
    .from('workout_logs')
    .select('*')
    .eq('athlete_id', currentProfile.id)
    .order('logged_at', { ascending: false });

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Scheda vuota.</div>`;
    return;
  }

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_name]) grouped[item.day_name] = [];
    grouped[item.day_name].push(item);
  });

  container.innerHTML = "";
  Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const groupEl = document.createElement("div");
    groupEl.className = "day-group";
    groupEl.innerHTML = `<div class="day-badge">📅 ${escapeHtml(dayName)}</div>`;

    grouped[dayName].forEach((row, idx) => {
      const ex = row.exercises;
      const start = ex ? ex.img_start : "";
      const end = ex ? (ex.img_end || ex.img_start) : "";
      const exLogs = (myLogs || []).filter(l => l.workout_exercise_id === row.id);
      const lastLog = exLogs[0];

      const itemEl = document.createElement("div");
      itemEl.className = "exercise-item";
      itemEl.innerHTML = `
        <div class="exercise-top">
          <div class="item-photos">
            ${start === end ? `
              <img src="${start}" class="item-img" style="width: 82px; object-fit: contain;">
            ` : `
              <img src="${start}" class="item-img">
              <img src="${end}" class="item-img">
            `}
          </div>
          <div class="item-details">
            <strong>${idx + 1}. ${escapeHtml(ex ? ex.name : 'Esercizio')}</strong>
            <div class="item-sub"><strong>${escapeHtml(row.sets_reps)}</strong> | Rest: ${escapeHtml(row.rest)} | Target RIR/@: ${escapeHtml(row.rir)}</div>
            ${row.notes && row.notes !== '-' ? `<div class="item-notes">Note: ${escapeHtml(row.notes)}</div>` : ''}
          </div>
        </div>

        <div class="log-box">
          <div id="logHistoryBox_${row.id}">
            ${renderAthleteLogSummary(exLogs)}
          </div>
          <div class="log-row-top">
            <input type="number" step="0.5" id="logWeight_${row.id}" placeholder="Peso (kg)" value="${lastLog && lastLog.weight_kg !== null ? lastLog.weight_kg : ''}">
            <input type="text" id="logReps_${row.id}" placeholder="Reps (es. 10-9-8)">
            <input type="number" step="0.5" id="logRir_${row.id}" placeholder="RIR / @" value="${lastLog && lastLog.rir !== null ? lastLog.rir : ''}">
          </div>
          <div class="log-row-bottom">
            <textarea id="logNote_${row.id}" rows="2" placeholder="Nota rapida (opzionale)"></textarea>
            <button class="btn btn-success btn-sm" onclick="saveAthleteLog('${row.id}')">Salva</button>
          </div>
        </div>
      `;
      groupEl.appendChild(itemEl);
    });

    container.appendChild(groupEl);
  });
}

window.saveAthleteLog = async function(workoutExerciseId) {
  const weightVal = document.getElementById(`logWeight_${workoutExerciseId}`).value;
  const repsVal = document.getElementById(`logReps_${workoutExerciseId}`).value.trim();
  const rirVal = document.getElementById(`logRir_${workoutExerciseId}`).value;
  const noteVal = document.getElementById(`logNote_${workoutExerciseId}`).value.trim();

  if (!weightVal && !repsVal && !rirVal && !noteVal) {
    alert("Inserisci almeno un dato (peso, ripetizioni, RIR/@ o una nota).");
    return;
  }

  const { error } = await supabaseClient
    .from('workout_logs')
    .insert({
      workout_exercise_id: workoutExerciseId,
      athlete_id: currentProfile.id,
      weight_kg: weightVal !== "" ? parseFloat(weightVal) : null,
      reps_done: repsVal || "-",
      rir: rirVal !== "" ? parseFloat(rirVal) : null,
      athlete_notes: noteVal || null
    });

  if (error) {
    alert("Errore salvataggio: " + error.message);
    return;
  }

  document.getElementById(`logNote_${workoutExerciseId}`).value = "";

  // Ricarica subito lo storico aggiornato per questo esercizio
  const { data: updatedLogs } = await supabaseClient
    .from('workout_logs')
    .select('*')
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('athlete_id', currentProfile.id)
    .order('logged_at', { ascending: false });

  const historyBox = document.getElementById(`logHistoryBox_${workoutExerciseId}`);
  if (historyBox && updatedLogs) {
    historyBox.innerHTML = renderAthleteLogSummary(updatedLogs);
  }
};

document.getElementById("btnLinkCoach").addEventListener("click", async () => {
  const code = document.getElementById("inputCoachCode").value.trim();
  if (!code) {
    alert("Inserisci il codice invito del tuo coach.");
    return;
  }

  const { error } = await supabaseClient
    .from('profiles')
    .update({ trainer_id: code })
    .eq('id', currentProfile.id);

  if (error) {
    alert("Codice non valido. Controlla di averlo copiato correttamente.");
  } else {
    currentProfile.trainer_id = code;
    initAthleteArea();
  }
});
