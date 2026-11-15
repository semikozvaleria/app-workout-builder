let currentAthleteCoachName = "";

function getAthleteFirstName(fullName, fallback = "") {
  if (!fullName) return fallback;
  const parts = String(fullName).trim().split(/\s+/);
  return parts[0] || fallback;
}

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

function getLocalDayKey(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isAthleteTodayLog(entry) {
  if (!entry) return false;
  const todayKey = getLocalDayKey(new Date().toISOString());
  return getLocalDayKey(entry.logged_at) === todayKey;
}

function isFreshOrTodayCoachReplyForAthlete(entry) {
  if (!entry || !entry.coach_notes) return false;
  if (entry.hasUnseenCoachReply) return true;
  if (!entry.coach_replied_at) return false;
  const todayKey = getLocalDayKey(new Date().toISOString());
  return getLocalDayKey(entry.coach_replied_at) === todayKey;
}

function getAthleteOlderYellowBoxStyle() {
  return "background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.45); color: #f59e0b;";
}

function getAthleteOlderCoachPinkBoxStyle() {
  return "background: rgba(236, 72, 153, 0.14); border: 1px solid rgba(236, 72, 153, 0.45); color: #f472b6;";
}

function buildAthleteCoachNoteHtml(entry, extraMarginTop = "") {
  if (!entry || !entry.coach_notes) return "";
  const isFresh = isFreshOrTodayCoachReplyForAthlete(entry);
  const coachFirstName = getAthleteFirstName(currentAthleteCoachName, "");
  const coachLabel = coachFirstName ? `Coach ${escapeHtml(coachFirstName)}` : "Coach";
  const coachDateStr = entry.coach_replied_at ? ` (${formatShortDate(entry.coach_replied_at)})` : '';
  const styleParts = ["white-space: pre-wrap;"];
  if (extraMarginTop) styleParts.push(`margin-top: ${extraMarginTop};`);
  if (!isFresh) styleParts.push(getAthleteOlderCoachPinkBoxStyle());

  return `<div class="note-coach-box" style="${styleParts.join(" ")}"><strong>${coachLabel}</strong>${coachDateStr}: ${escapeHtml(entry.coach_notes)}</div>`;
}

function parsePrescribedSetsCount(setsRepsStr) {
  if (!setsRepsStr) return 1;
  const match = String(setsRepsStr).trim().match(/^(\d+)\s*[xX×*]/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 12) return n;
  }
  return 1;
}

function parseSeriesBreakdown(log) {
  if (!log) return [];
  const raw = (log.reps_done || "").trim();

  if (raw.includes("S1:")) {
    return raw.split("|").map(part => {
      const m = part.trim().match(/^S(\d+):\s*(?:([0-9.,]+)\s*kg)?\s*(?:×|x)?\s*([^(|]+?)?(?:\s*\(RIR\s*([0-9.,]+)\))?$/i);
      if (!m) return null;
      return {
        setNum: parseInt(m[1], 10),
        kg: m[2] ? m[2].replace(',', '.') : "",
        reps: m[3] && m[3].trim() !== '-' ? m[3].trim() : "",
        rir: m[4] ? m[4].replace(',', '.') : ""
      };
    }).filter(Boolean);
  }

  if (log.weight_kg !== null || (raw && raw !== '-') || log.rir !== null) {
    return [{
      setNum: 1,
      kg: log.weight_kg !== null && log.weight_kg !== undefined ? String(log.weight_kg) : "",
      reps: raw && raw !== '-' ? raw : "",
      rir: log.rir !== null && log.rir !== undefined ? String(log.rir) : ""
    }];
  }

  return [];
}

function formatLogSummaryHtml(entry, dateStr) {
  const safeName = escapeHtml(getAthleteFirstName(currentProfile && currentProfile.full_name, "Atleta"));
  const rirFallback = (entry.rir !== null && entry.rir !== undefined) ? ` • RIR ${entry.rir}` : '';
  const noteLine = entry.athlete_notes ? `\n📝 ${escapeHtml(entry.athlete_notes)}` : '';

  if (entry.reps_done && entry.reps_done.includes("S1:")) {
    const lines = entry.reps_done
      .split("|")
      .map(s => `• ${escapeHtml(s.trim())}`)
      .join("\n");
    return `<strong>${safeName}</strong> (${dateStr})\n${lines}${noteLine}`;
  }

  const kgStr = (entry.weight_kg !== null && entry.weight_kg !== undefined) ? `${entry.weight_kg} kg` : '-';
  const repsStr = escapeHtml(entry.reps_done || '-');
  return `<strong>${safeName}</strong> (${dateStr}) — ${kgStr} × ${repsStr}${rirFallback}${noteLine}`;
}

function consolidateLogsByDay(logs) {
  if (!logs || logs.length === 0) return [];
  const sorted = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const byDay = new Map();

  sorted.forEach(log => {
    const dayKey = getLocalDayKey(log.logged_at);
    const coachReplyIsUnseen = Boolean(log.coach_notes && !log.athlete_seen_at);

    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        id: log.id,
        logged_at: log.logged_at,
        weight_kg: log.weight_kg,
        reps_done: log.reps_done,
        rir: log.rir,
        hasUnseenCoachReply: coachReplyIsUnseen,
        notesList: log.athlete_notes ? [log.athlete_notes.trim()] : [],
        coachNotesList: log.coach_notes ? [log.coach_notes.trim()] : [],
        coach_replied_at: log.coach_replied_at || null
      });
    } else {
      const entry = byDay.get(dayKey);
      if (coachReplyIsUnseen) entry.hasUnseenCoachReply = true;
      if (log.coach_replied_at && (!entry.coach_replied_at || new Date(log.coach_replied_at) > new Date(entry.coach_replied_at))) {
        entry.coach_replied_at = log.coach_replied_at;
      }
      if ((entry.weight_kg === null || entry.weight_kg === undefined) && log.weight_kg !== null && log.weight_kg !== undefined) {
        entry.weight_kg = log.weight_kg;
      }
      if ((!entry.reps_done || entry.reps_done === '-') && log.reps_done && log.reps_done !== '-') {
        entry.reps_done = log.reps_done;
      }
      if ((entry.rir === null || entry.rir === undefined) && log.rir !== null && log.rir !== undefined) {
        entry.rir = log.rir;
      }
      if (log.athlete_notes) {
        const clean = log.athlete_notes.trim();
        if (clean && !entry.notesList.includes(clean)) {
          entry.notesList.unshift(clean);
        }
      }
      if (log.coach_notes) {
        const cleanC = log.coach_notes.trim();
        if (cleanC && !entry.coachNotesList.includes(cleanC)) {
          entry.coachNotesList.unshift(cleanC);
        }
      }
    }
  });

  return Array.from(byDay.values()).map(e => ({
    ...e,
    athlete_notes: e.notesList.join("\n"),
    coach_notes: e.coachNotesList.join("\n")
  }));
}

function buildAthleteExerciseCardHtml(row, idx, rawLogs) {
  const ex = row.exercises;
  const start = ex ? ex.img_start : "";
  const end = ex ? (ex.img_end || ex.img_start) : "";
  const isSingle = start === end;

  const dailyLogs = consolidateLogsByDay(rawLogs);
  const latestLog = dailyLogs.length > 0 ? dailyLogs[0] : null;
  const setsCount = parsePrescribedSetsCount(row.sets_reps);
  const parsedSeries = parseSeriesBreakdown(latestLog);

  let roleTag = "";
  if (row.circuit_role === "start") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 INIZIO CIRCUITO</span>`;
  } else if (row.circuit_role === "end") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🏁 FINE CIRCUITO</span>`;
  } else if (row.circuit_role === "single") {
    roleTag = `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 BLOCCO CIRCUITO</span>`;
  }

  let seriesRowsHtml = "";
  for (let s = 1; s <= setsCount; s++) {
    const prevSet = parsedSeries.find(item => item.setNum === s) || {};
    seriesRowsHtml += `
      <div class="athlete-inputs-row" style="align-items: center;">
        <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary); min-width: 26px; text-align: center;">S${s}</span>
        <input type="number" step="0.5" placeholder="Kg" id="logKg_${row.id}_${s}" class="inp-kg" value="${escapeHtml(prevSet.kg || '')}" title="Serie ${s} - Carico (Kg)">
        <input type="text" placeholder="Reps" id="logReps_${row.id}_${s}" class="inp-reps" value="${escapeHtml(prevSet.reps || '')}" title="Serie ${s} - Ripetizioni">
        <input type="number" step="0.5" placeholder="RIR" id="logRir_${row.id}_${s}" class="inp-rir" value="${escapeHtml(prevSet.rir || '')}" title="Serie ${s} - RIR">
      </div>
    `;
  }

  let latestBoxesHtml = `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">Nessun carico ancora registrato</div>`;

  if (latestLog) {
    const isToday = isAthleteTodayLog(latestLog);
    const dStr = formatShortDate(latestLog.logged_at);
    const mainSummary = formatLogSummaryHtml(latestLog, dStr);
    const mainBoxStyle = isToday ? "white-space: pre-wrap;" : `white-space: pre-wrap; ${getAthleteOlderYellowBoxStyle()}`;
    const coachBoxHtml = buildAthleteCoachNoteHtml(latestLog);

    const olderHtml = dailyLogs.length > 1 ? `
      <details class="past-logs-details" style="margin-top: 6px;">
        <summary>Vedi giorni precedenti (${dailyLogs.length - 1})</summary>
        <div style="margin-top: 5px; display: flex; flex-direction: column; gap: 5px;">
          ${dailyLogs.slice(1).map(old => {
            const oldToday = isAthleteTodayLog(old);
            const od = formatShortDate(old.logged_at);
            const oldSummary = formatLogSummaryHtml(old, od);
            const oldStyle = oldToday ? "margin-top:0; white-space: pre-wrap;" : `margin-top:0; white-space: pre-wrap; ${getAthleteOlderYellowBoxStyle()}`;
            const ocoach = buildAthleteCoachNoteHtml(old, "3px");
            return `
              <div style="border-top: 1px dashed var(--border); padding-top: 4px;">
                <div class="note-athlete-box" style="${oldStyle}">${oldSummary}</div>
                ${ocoach}
              </div>
            `;
          }).join("")}
        </div>
      </details>
    ` : "";

    latestBoxesHtml = `
      <div class="note-athlete-box" style="${mainBoxStyle}">${mainSummary}</div>
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
          ${row.notes && row.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(row.notes)}</div>` : ''}
        </div>
      </div>

      <div class="athlete-log-bar" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
          ${seriesRowsHtml}
        </div>
        <div style="display: flex; gap: 6px; align-items: flex-end;">
          <textarea id="logNote_${row.id}" rows="2" placeholder="Note generali per questo esercizio..." style="flex: 1; min-height: 44px; font-size: 0.78rem; padding: 6px 8px; border-color: rgba(16, 185, 129, 0.45); resize: vertical;"></textarea>
          <button type="button" class="btn btn-success btn-sm" style="width: auto; flex-shrink: 0; align-self: stretch;" onclick="saveWorkoutLog('${row.id}', ${setsCount})">Salva</button>
        </div>
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
    currentAthleteCoachName = coach.full_name || "";
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
    notesEl.innerHTML = `<strong>NOTE DEL COACH:</strong>\n${escapeHtml(workout.general_notes)}`;
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

  const hasNewWorkout = !workout.athlete_seen_at;
  const hasUnreadCoachComment = (logs || []).some(l => l.coach_notes && !l.athlete_seen_at);

  if (hasNewWorkout || hasUnreadCoachComment) {
    let msg = "Il tuo coach ha aggiornato la tua scheda di allenamento.";
    if (hasNewWorkout && hasUnreadCoachComment) {
      msg = "Hai una nuova scheda assegnata e nuove indicazioni dal tuo coach.";
    } else if (hasUnreadCoachComment) {
      msg = "Il tuo coach ha lasciato un commento sui tuoi esercizi.";
    }

    athleteAlerts.unshift({
      level: "info",
      title: "Novità dal tuo Coach",
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

window.saveWorkoutLog = async function(workoutExerciseId, setsCount = 1) {
  const seriesParts = [];
  let maxWeight = null;
  let rirSum = 0;
  let rirCount = 0;

  for (let s = 1; s <= setsCount; s++) {
    const kgEl = document.getElementById(`logKg_${workoutExerciseId}_${s}`);
    const repsEl = document.getElementById(`logReps_${workoutExerciseId}_${s}`);
    const rirEl = document.getElementById(`logRir_${workoutExerciseId}_${s}`);

    const kgVal = kgEl ? kgEl.value.trim() : "";
    const repsVal = repsEl ? repsEl.value.trim() : "";
    const rirVal = rirEl ? rirEl.value.trim() : "";

    if (kgVal || repsVal || rirVal) {
      const kgNum = kgVal ? parseFloat(kgVal) : null;
      const rirNum = rirVal ? parseFloat(rirVal) : null;

      if (kgNum !== null && !isNaN(kgNum)) {
        if (maxWeight === null || kgNum > maxWeight) maxWeight = kgNum;
      }
      if (rirNum !== null && !isNaN(rirNum)) {
        rirSum += rirNum;
        rirCount++;
      }

      const kgTxt = kgVal ? `${kgVal} kg` : "-";
      const repsTxt = repsVal || "-";
      const rirTxt = rirVal ? ` (RIR ${rirVal})` : "";
      seriesParts.push(`S${s}: ${kgTxt} × ${repsTxt}${rirTxt}`);
    }
  }

  const noteVal = document.getElementById(`logNote_${workoutExerciseId}`).value.trim();

  if (seriesParts.length === 0 && !noteVal) {
    alert("Compila almeno una serie (Kg, Reps o RIR) oppure inserisci una nota.");
    return;
  }

  const formattedSeriesStr = seriesParts.length > 0 ? seriesParts.join(" | ") : null;
  const avgRir = rirCount > 0 ? Math.round((rirSum / rirCount) * 10) / 10 : null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayLogs } = await supabaseClient
    .from('workout_logs')
    .select('*')
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('athlete_id', currentProfile.id)
    .gte('logged_at', startOfDay)
    .lte('logged_at', endOfDay)
    .order('logged_at', { ascending: false });

  let error = null;

  if (todayLogs && todayLogs.length > 0) {
    const primaryLog = todayLogs[0];
    const existingNotes = todayLogs
      .map(l => (l.athlete_notes || "").trim())
      .filter(Boolean)
      .reverse();

    if (noteVal && !existingNotes.includes(noteVal)) {
      existingNotes.push(noteVal);
    }

    const res = await supabaseClient
      .from('workout_logs')
      .update({
        weight_kg: maxWeight !== null ? maxWeight : primaryLog.weight_kg,
        reps_done: formattedSeriesStr || primaryLog.reps_done || "-",
        rir: avgRir !== null ? avgRir : primaryLog.rir,
        athlete_notes: existingNotes.length > 0 ? existingNotes.join("\n") : null,
        logged_at: now.toISOString(),
        trainer_seen_at: null,
        athlete_seen_at: now.toISOString()
      })
      .eq('id', primaryLog.id);

    error = res.error;
  } else {
    const res = await supabaseClient
      .from('workout_logs')
      .insert({
        workout_exercise_id: workoutExerciseId,
        athlete_id: currentProfile.id,
        weight_kg: maxWeight,
        reps_done: formattedSeriesStr || "-",
        rir: avgRir,
        athlete_notes: noteVal || null,
        trainer_seen_at: null,
        athlete_seen_at: now.toISOString()
      });

    error = res.error;
  }

  if (error) {
    alert("Errore salvataggio: " + error.message);
  } else {
    alert("✅ Dati salvati! Il tuo Personal Trainer è stato avvisato.");
    loadAthleteWorkout();
  }
};
