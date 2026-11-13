async function initAthleteArea() {
  if (!currentProfile.trainer_id) {
    document.getElementById("athleteLinkCoachCard").classList.remove("hidden");
    document.getElementById("athleteWorkoutCard").classList.add("hidden");
    updateNotificationCenter([]);
  } else {
    document.getElementById("athleteLinkCoachCard").classList.add("hidden");
    document.getElementById("athleteWorkoutCard").classList.remove("hidden");
    await loadAthleteWorkout();
  }
}

document.getElementById("btnLinkCoach").addEventListener("click", async () => {
  const code = document.getElementById("inputCoachCode").value.trim();
  if (!code) {
    alert("Inserisci il codice invito del tuo coach.");
    return;
  }

  const { data: coach, error } = await supabaseClient
    .from('profiles')
    .select('id, full_name, role, logo_url')
    .eq('id', code)
    .eq('role', 'trainer')
    .single();

  if (error || !coach) {
    alert("Codice invito non valido. Controlla di aver copiato tutto il codice.");
    return;
  }

  const { error: uError } = await supabaseClient
    .from('profiles')
    .update({ trainer_id: coach.id })
    .eq('id', currentProfile.id);

  if (uError) {
    alert("Errore collegamento: " + uError.message);
  } else {
    currentProfile.trainer_id = coach.id;
    applyBrandLogo(coach.logo_url);
    alert(`Collegato con successo al coach ${coach.full_name}!`);
    initAthleteArea();
  }
});

// Segna come viste dall'atleta la scheda e le note del coach
window.markAthleteUpdatesAsSeen = async function(workoutId) {
  const nowIso = new Date().toISOString();
  await Promise.all([
    workoutId
      ? supabaseClient.from('workouts').update({ athlete_seen_at: nowIso }).eq('id', workoutId)
      : Promise.resolve(),
    supabaseClient
      .from('workout_logs')
      .update({ athlete_seen_at: nowIso })
      .eq('athlete_id', currentProfile.id)
      .is('athlete_seen_at', null)
  ]);

  document.getElementById("notificationsSection").classList.add("hidden");
  await loadAthleteWorkout();
};

function formatShortDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// Costruisce il markup HTML della singola card esercizio nell'app Atleta
function buildAthleteExerciseCardHtml(row, idx, exLogs) {
  const ex = row.exercises;
  const start = ex ? ex.img_start : "";
  const end = ex ? (ex.img_end || ex.img_start) : "";
  const isSingle = start === end;
  const latestLog = exLogs && exLogs.length > 0 ? exLogs[0] : null;

  let roleTag = "";
  if (row.circuit_role === "start") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 INIZIO CIRCUITO</span>`;
  } else if (row.circuit_role === "end") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🏁 FINE CIRCUITO</span>`;
  } else if (row.circuit_role === "single") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 BLOCCO CIRCUITO</span>`;
  }

  let latestBoxesHtml = `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Nessun carico ancora registrato</div>`;

  if (latestLog) {
    const dStr = formatShortDate(latestLog.logged_at);
    const kgStr = latestLog.weight_kg !== null && latestLog.weight_kg !== undefined ? `${latestLog.weight_kg} kg` : '-';
    const repsStr = escapeHtml(latestLog.reps_done || '-');
    const rirStr = latestLog.rir !== null && latestLog.rir !== undefined ? ` • RIR ${latestLog.rir}` : '';
    const noteLine = latestLog.athlete_notes ? `\n"${escapeHtml(latestLog.athlete_notes)}"` : '';

    const coachDateStr = latestLog.coach_replied_at ? ` (${formatShortDate(latestLog.coach_replied_at)})` : '';
    const coachBoxHtml = latestLog.coach_notes
      ? `<div class="note-coach-box">🔴 Risposta Coach${coachDateStr}: ${escapeHtml(latestLog.coach_notes)}</div>`
      : "";

    const olderHtml = exLogs.length > 1 ? `
      <details class="past-logs-details" style="margin-top: 6px;">
        <summary>Vedi sessioni precedenti (${exLogs.length - 1})</summary>
        <div style="margin-top: 5px; display: flex; flex-direction: column; gap: 5px;">
          ${exLogs.slice(1).map(old => {
            const od = formatShortDate(old.logged_at);
            const okg = old.weight_kg !== null && old.weight_kg !== undefined ? `${old.weight_kg} kg` : '-';
            const orir = old.rir !== null && old.rir !== undefined ? ` • RIR ${old.rir}` : '';
            const onote = old.athlete_notes ? `\n"${escapeHtml(old.athlete_notes)}"` : '';
            const ocd = old.coach_replied_at ? ` (${formatShortDate(old.coach_replied_at)})` : '';
            const ocoach = old.coach_notes
              ? `<div class="note-coach-box" style="margin-top:3px;">🔴 Coach${ocoach ? ocd : ''}: ${escapeHtml(old.coach_notes)}</div>`
              : '';
            return `
              <div style="border-top: 1px dashed var(--border); padding-top: 4px;">
                <div class="note-athlete-box" style="margin-top:0;">🟢 ${od}: ${okg} × ${escapeHtml(old.reps_done || '-')}${orir}${onote}</div>
                ${ocoach}
              </div>
            `;
          }).join("")}
        </div>
      </details>
    ` : "";

    latestBoxesHtml = `
      <div class="note-athlete-box">🟢 ${dStr} — ${kgStr} × ${repsStr}${rirStr}${noteLine}</div>
      ${coachBoxHtml}
      ${olderHtml}
    `;
  }

  return `
    <div class="exercise-item">
      <div class="exercise-top">
        <div class="item-photos">
          ${isSingle ? `
            <img src="${start}" class="item-img" style="width: 82px; object-fit: contain;">
          ` : `
            <img src="${start}" class="item-img">
            <img src="${end}" class="item-img">
          `}
        </div>
        <div class="item-details">
          <strong>${idx + 1}. ${escapeHtml(ex ? ex.name : 'Esercizio')}</strong> ${roleTag}
          <div class="item-sub"><strong>${escapeHtml(row.sets_reps)}</strong> | Rest: ${escapeHtml(row.rest)} | RIR/@: ${escapeHtml(row.rir)}</div>
          ${row.notes && row.notes !== '-' ? `<div class="item-notes">Note: ${escapeHtml(row.notes)}</div>` : ''}
        </div>
      </div>

      <!-- Barra Diario Carichi compatta + Riquadri Verde (Atleta) e Rosso (Coach) datati -->
      <div class="athlete-log-bar" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <div class="athlete-inputs-row">
          <input type="number" step="0.5" placeholder="Kg" id="logKg_${row.id}" class="inp-kg" value="${latestLog?.weight_kg ?? ''}" title="Carico usato (Kg)">
          <input type="text" placeholder="Reps (es. 10-9-8)" id="logReps_${row.id}" class="inp-reps" value="${latestLog?.reps_done && latestLog.reps_done !== '-' ? escapeHtml(latestLog.reps_done) : ''}" title="Ripetizioni eseguite">
          <input type="number" step="0.5" placeholder="RIR" id="logRir_${row.id}" class="inp-rir" value="${latestLog?.rir ?? ''}" title="RIR percepito">
          <button type="button" class="btn btn-success btn-sm" onclick="saveWorkoutLog('${row.id}')">Salva</button>
        </div>
        <input type="text" id="logNote_${row.id}" placeholder="🟢 Scrivi una nota per la sessione di oggi (sensazioni, fatica, dolore)..." style="font-size: 0.78rem; padding: 6px 8px; border-color: rgba(16, 185, 129, 0.45);">
        ${latestBoxesHtml}
      </div>
    </div>
  `;
}

async function loadAthleteWorkout() {
  const { data: coach } = await supabaseClient
    .from('profiles')
    .select('full_name, logo_url')
    .eq('id', currentProfile.trainer_id)
    .single();

  if (coach) {
    document.getElementById("athleteCoachName").textContent = `Coach: ${coach.full_name}`;
    applyBrandLogo(coach.logo_url);
  }

  const { data: workout, error } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('athlete_id', currentProfile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const container = document.getElementById("athleteExercisesContainer");
  const notesEl = document.getElementById("athleteGeneralNotes");
  const metaEl = document.getElementById("athleteWorkoutMeta");

  if (error || !workout) {
    metaEl.textContent = "In attesa che il tuo Personal Trainer ti assegni una scheda.";
    notesEl.classList.add("hidden");
    container.innerHTML = "";
    updateNotificationCenter([{
      level: "warning",
      title: "Nessuna scheda attiva",
      message: "Il tuo coach non ha ancora pubblicato una scheda attiva sul tuo profilo."
    }]);
    return;
  }

  const end = workout.end_date ? new Date(workout.end_date) : null;
  const endStr = end ? end.toLocaleDateString('it-IT') : '-';
  metaEl.textContent = `Durata: ${workout.duration_weeks} settimane • Scadenza: ${endStr}`;

  const athleteAlerts = [];
  if (end) {
    const diffDays = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      athleteAlerts.push({
        level: "danger",
        title: "⚠️ Scheda Scaduta",
        message: `La tua scheda è scaduta il ${endStr}. Contatta il tuo coach per il rinnovo!`
      });
    } else if (diffDays <= 5) {
      athleteAlerts.push({
        level: "warning",
        title: "⏳ Scheda in Scadenza",
        message: `Mancano ${diffDays} giorni alla scadenza della tua scheda (${endStr}).`
      });
    }
  }

  if (workout.general_notes) {
    notesEl.classList.remove("hidden");
    notesEl.textContent = "NOTE DEL COACH:\n" + workout.general_notes;
  } else {
    notesEl.classList.add("hidden");
  }

  const [{ data: items }, { data: logs }] = await Promise.all([
    supabaseClient
      .from('workout_exercises')
      .select('*, exercises(*)')
      .eq('workout_id', workout.id)
      .order('order_index', { ascending: true }),
    supabaseClient
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', currentProfile.id)
      .order('logged_at', { ascending: false })
  ]);

  const logsByExercise = {};
  (logs || []).forEach(l => {
    if (!logsByExercise[l.workout_exercise_id]) {
      logsByExercise[l.workout_exercise_id] = [];
    }
    logsByExercise[l.workout_exercise_id].push(l);
  });

  // 1 sola notifica cumulativa se il coach ha inviato una nuova scheda o commentato in rosso (non ancora visti dall'atleta)
  const hasNewWorkout = !workout.athlete_seen_at;
  const hasUnreadCoachComment = (logs || []).some(l => l.coach_notes && !l.athlete_seen_at);

  if (hasNewWorkout || hasUnreadCoachComment) {
    let msg = "Il tuo coach ha aggiornato la tua scheda di allenamento.";
    if (hasNewWorkout && hasUnreadCoachComment) {
      msg = "Hai una nuova scheda assegnata e nuove indicazioni in rosso dal tuo coach.";
    } else if (hasUnreadCoachComment) {
      msg = "Il tuo coach ha lasciato un commento in rosso sui tuoi esercizi.";
    }

    athleteAlerts.unshift({
      level: "info",
      title: "🔴 Novità dal tuo Coach",
      message: msg,
      actionHtml: `<button class="btn btn-primary btn-sm" onclick="markAthleteUpdatesAsSeen('${workout.id}')">Segna come letto</button>`
    });
  }

  updateNotificationCenter(athleteAlerts);

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">Nessun esercizio inserito nella scheda.</div>`;
    return;
  }

  container.innerHTML = "";
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_name]) grouped[item.day_name] = [];
    grouped[item.day_name].push(item);
  });

  Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(dayName => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "day-group";
    groupDiv.innerHTML = `<div class="day-badge">📅 ${escapeHtml(dayName)}</div>`;

    const dayItems = grouped[dayName];
    let inCircuit = false;
    let circuitHtmlBuffer = "";
    let circuitHeaderTitle = "CIRCUITO";

    dayItems.forEach((row, idx) => {
      const exLogs = logsByExercise[row.id] || [];
      const cardHtml = buildAthleteExerciseCardHtml(row, idx, exLogs);

      if (row.circuit_role === "single") {
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
        const label = row.circuit_label ? row.circuit_label : "BLOCCO CIRCUITO";
        groupDiv.innerHTML += `
          <div class="circuit-group-box">
            <div class="circuit-group-header"><span>🔄 ${escapeHtml(label)}</span><span>CIRCUITO</span></div>
            ${cardHtml}
            <div class="circuit-group-footer">🏁 Fine Circuito</div>
          </div>
        `;
      } else if (row.circuit_role === "start") {
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
        circuitHeaderTitle = row.circuit_label ? row.circuit_label : "CIRCUITO";
        circuitHtmlBuffer = cardHtml;
      } else if (row.circuit_role === "end") {
        if (inCircuit) {
          circuitHtmlBuffer += cardHtml;
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
          groupDiv.innerHTML += cardHtml;
        }
      } else {
        if (inCircuit) {
          circuitHtmlBuffer += cardHtml;
        } else {
          groupDiv.innerHTML += cardHtml;
        }
      }
    });

    if (inCircuit) {
      groupDiv.innerHTML += `
        <div class="circuit-group-box">
          <div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitHeaderTitle)}</span><span>INIZIO CIRCUITO</span></div>
          ${circuitHtmlBuffer}
          <div class="circuit-group-footer">🏁 Fine Circuito</div>
        </div>
      `;
    }

    container.appendChild(groupDiv);
  });
}

window.saveWorkoutLog = async function(workoutExerciseId) {
  const kgVal = document.getElementById(`logKg_${workoutExerciseId}`).value;
  const repsVal = document.getElementById(`logReps_${workoutExerciseId}`).value.trim();
  const rirVal = document.getElementById(`logRir_${workoutExerciseId}`).value;
  const noteVal = document.getElementById(`logNote_${workoutExerciseId}`).value.trim();

  if (!kgVal && !repsVal && !noteVal) {
    alert("Inserisci almeno il peso usato, le ripetizioni o una nota.");
    return;
  }

  const { error } = await supabaseClient
    .from('workout_logs')
    .insert({
      workout_exercise_id: workoutExerciseId,
      athlete_id: currentProfile.id,
      weight_kg: kgVal ? parseFloat(kgVal) : null,
      reps_done: repsVal || "-",
      rir: rirVal ? parseFloat(rirVal) : null,
      athlete_notes: noteVal || null,
      trainer_seen_at: null,
      athlete_seen_at: new Date().toISOString()
    });

  if (error) {
    alert("Errore salvataggio: " + error.message);
  } else {
    alert("✅ Dati salvati! Il tuo Personal Trainer è stato avvisato.");
    loadAthleteWorkout();
  }
};
