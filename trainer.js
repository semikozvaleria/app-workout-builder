let enrichedClientsCache = [];
let trainerClientsSearchTerm = "";
const loadedWorkoutExercisesCache = new Map();

async function initTrainerArea() {
  document.getElementById("trainerInviteCode").textContent = currentProfile.id;
  await loadTrainerClients();
}

document.getElementById("btnCopyCode").addEventListener("click", () => {
  navigator.clipboard.writeText(currentProfile.id);
  const btn = document.getElementById("btnCopyCode");
  btn.textContent = "Copiato!";
  setTimeout(() => btn.textContent = "Copia", 2000);
});

const trainerSearchInputEl = document.getElementById("trainerClientsSearchInput");
const btnClearTrainerSearchEl = document.getElementById("btnClearTrainerClientsSearch");

if (trainerSearchInputEl) {
  trainerSearchInputEl.addEventListener("input", (e) => {
    trainerClientsSearchTerm = e.target.value.trim().toLowerCase();
    if (btnClearTrainerSearchEl) {
      btnClearTrainerSearchEl.classList.toggle("hidden", trainerClientsSearchTerm.length === 0);
    }
    renderConnectedClientsList();
    if (typeof renderExternalAthletesList === "function") renderExternalAthletesList();
  });
}

if (btnClearTrainerSearchEl) {
  btnClearTrainerSearchEl.addEventListener("click", () => {
    trainerClientsSearchTerm = "";
    if (trainerSearchInputEl) trainerSearchInputEl.value = "";
    btnClearTrainerSearchEl.classList.add("hidden");
    renderConnectedClientsList();
    if (typeof renderExternalAthletesList === "function") renderExternalAthletesList();
  });
}

function showTrainerView(viewId) {
  document.getElementById("trainerClientsView").classList.add("hidden");
  document.getElementById("trainerBuilderView").classList.add("hidden");
  document.getElementById("trainerProgressView").classList.add("hidden");
  document.getElementById("trainerWorkoutsView").classList.add("hidden");
  document.getElementById("trainerStatsView").classList.add("hidden");
  document.getElementById("trainerAnamnesisView").classList.add("hidden");
  const extWorkoutsView = document.getElementById("trainerExternalWorkoutsView");
  if (extWorkoutsView) extWorkoutsView.classList.add("hidden");
  const checkinsView = document.getElementById("trainerCheckinsView");
  if (checkinsView) checkinsView.classList.add("hidden");

  document.getElementById(viewId).classList.remove("hidden");

  document.getElementById("navTrainerClients").className = viewId === "trainerClientsView" ? "btn btn-primary" : "btn btn-outline";
  document.getElementById("navTrainerBuilder").className = viewId === "trainerBuilderView" ? "btn btn-primary" : "btn btn-outline";
}

document.getElementById("navTrainerClients").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
  loadTrainerClients();
});

document.getElementById("navTrainerBuilder").addEventListener("click", () => {
  showTrainerView("trainerBuilderView");
  if (typeof loadTrainerDrafts === "function") loadTrainerDrafts();
  if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();
});

document.getElementById("btnBackToClients").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
  loadTrainerClients();
});

document.getElementById("btnBackFromWorkouts").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
});

window.markTrainerNotificationSeen = async function(notifId) {
  await supabaseClient
    .from('trainer_notifications')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', notifId)
    .eq('trainer_id', currentProfile.id);

  await loadTrainerClients();
};

function getTrainerFirstName(fullName, fallback = "") {
  if (!fullName) return fallback;
  const parts = String(fullName).trim().split(/\s+/);
  return parts[0] || fallback;
}

function getTrainerDayKey(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isFreshOrTodayLog(entry) {
  if (!entry) return false;
  if (entry.hasUnseen) return true;
  const todayKey = getTrainerDayKey(new Date().toISOString());
  return getTrainerDayKey(entry.logged_at) === todayKey;
}

function isFreshOrTodayCoachReply(entry) {
  if (!entry || !entry.coach_notes) return false;
  if (entry.hasUnseenCoachReply) return true;
  if (!entry.coach_replied_at) return false;
  const todayKey = getTrainerDayKey(new Date().toISOString());
  return getTrainerDayKey(entry.coach_replied_at) === todayKey;
}

function getOlderYellowBoxStyle() {
  return "background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.45); color: #f59e0b;";
}

function getOlderCoachPinkBoxStyle() {
  return "background: rgba(236, 72, 153, 0.14); border: 1px solid rgba(236, 72, 153, 0.45); color: #f472b6;";
}

function buildTrainerCoachNoteHtml(entry, extraMarginTop = "") {
  if (!entry || !entry.coach_notes) return "";
  const isFresh = isFreshOrTodayCoachReply(entry);
  const coachFirstName = getTrainerFirstName(currentProfile && currentProfile.full_name, "");
  const coachLabel = coachFirstName ? `Coach ${escapeHtml(coachFirstName)}` : "Coach";
  const coachDateStr = entry.coach_replied_at
    ? ` (${new Date(entry.coach_replied_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })})`
    : '';
  const styleParts = ["white-space: pre-wrap;"];
  if (extraMarginTop) styleParts.push(`margin-top: ${extraMarginTop};`);
  if (!isFresh) styleParts.push(getOlderCoachPinkBoxStyle());

  return `<div class="note-coach-box" style="${styleParts.join(" ")}"><strong>${coachLabel}</strong>${coachDateStr}: ${escapeHtml(entry.coach_notes)}</div>`;
}

function formatTrainerLogSummaryHtml(entry, dateStr, athleteName = "Atleta") {
  const safeName = escapeHtml(getTrainerFirstName(athleteName, "Atleta"));
  // Mesociclo: indica a quale settimana si riferisce la registrazione
  if (entry.showWeek && entry.week_number) {
    dateStr = `${dateStr} · Sett. ${entry.week_number}`;
  }
  const rirTxt = (entry.rir !== null && entry.rir !== undefined) ? ` • RIR/@: ${entry.rir}` : '';
  const athNoteLine = entry.athlete_notes ? `\n📝 ${escapeHtml(entry.athlete_notes)}` : '';

  if (entry.reps_done && entry.reps_done.includes("S1:")) {
    const lines = entry.reps_done
      .split("|")
      .map(s => `• ${escapeHtml(s.trim())}`)
      .join("\n");
    return `<strong>${safeName}</strong> (${dateStr})\n${lines}${athNoteLine}`;
  }

  return `<strong>${safeName}</strong> (${dateStr}) — ${entry.weight_kg ?? '-'} kg × ${escapeHtml(entry.reps_done || '-')}${rirTxt}${athNoteLine}`;
}

function consolidateTrainerLogsByDay(logs, unseenIdsSet = new Set()) {
  if (!logs || logs.length === 0) return [];
  const sorted = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
  const byDay = new Map();

  sorted.forEach(log => {
    const dayKey = getTrainerDayKey(log.logged_at);
    const logIsUnseen = unseenIdsSet.has(log.id) || !log.trainer_seen_at;
    const coachReplyIsUnseen = Boolean(log.coach_notes && !log.athlete_seen_at);

    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        id: log.id,
        logged_at: log.logged_at,
        weight_kg: log.weight_kg,
        reps_done: log.reps_done,
        rir: log.rir,
        week_number: log.week_number || null,
        hasUnseen: logIsUnseen,
        hasUnseenCoachReply: coachReplyIsUnseen,
        notesList: log.athlete_notes ? [log.athlete_notes.trim()] : [],
        coachNotesList: log.coach_notes ? [log.coach_notes.trim()] : [],
        coach_replied_at: log.coach_replied_at || null
      });
    } else {
      const entry = byDay.get(dayKey);
      if (logIsUnseen) entry.hasUnseen = true;
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

function renderConnectedClientsList() {
  const container = document.getElementById("clientsListContainer");
  const countEl = document.getElementById("clientsCount");
  if (!container) return;

  if (!enrichedClientsCache || enrichedClientsCache.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessun atleta ancora collegato. Condividi il tuo Codice Invito!</div>`;
    if (countEl) countEl.textContent = "0 atleti";
    return;
  }

  const term = trainerClientsSearchTerm;
  const anamList = (typeof trainerAnamnesisList !== "undefined") ? trainerAnamnesisList : [];
  const filtered = term
    ? enrichedClientsCache.filter(({ client }) => {
        const nameMatch = (client.full_name || "").toLowerCase().includes(term);
        const emailMatch = (client.email || "").toLowerCase().includes(term);
        const anam = anamList.find(a => a.athlete_id === client.id);
        const anamMatch = anam
          ? ((anam.goal || "").toLowerCase().includes(term) || (anam.private_notes || "").toLowerCase().includes(term))
          : false;
        return nameMatch || emailMatch || anamMatch;
      })
    : enrichedClientsCache;

  if (countEl) {
    countEl.textContent = term
      ? `${filtered.length} di ${enrichedClientsCache.length}`
      : `${enrichedClientsCache.length} atleti`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.84rem; padding: 12px;">Nessun atleta collegato corrisponde a "${escapeHtml(trainerClientsSearchTerm)}".</div>`;
    return;
  }

  container.innerHTML = "";
  filtered.forEach(({ client, badgeHtml, hasUnreadUpdate, hasUnreviewedCheckin, hasAnamnesis, hasPendingVideos }) => {
    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div>
        <strong style="font-size: 0.95rem; display: block;">
          ${escapeHtml(client.full_name)}
          ${hasUnreadUpdate ? '<span style="font-size:0.7rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; margin-left:4px;">● Da vedere</span>' : ''}
          ${hasPendingVideos ? '<span style="font-size:0.7rem; background:rgba(56,189,248,0.18); color:#38bdf8; padding:1px 6px; border-radius:4px; margin-left:4px;">🎥 Video</span>' : ''}
        </strong>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(client.email)}</span><br>
        ${badgeHtml}
      </div>
      <div class="client-actions">
        <button class="btn btn-outline btn-sm" style="${hasUnreviewedCheckin ? 'border-color: #10b981; color: #10b981;' : ''}" onclick="openTrainerAthleteCheckins('${client.id}', '${escapeJsAttr(client.full_name)}')">✅ Check-in${hasUnreviewedCheckin ? ' ●' : ''}</button>
        <button class="btn btn-outline btn-sm" style="${hasAnamnesis ? 'border-color: var(--primary); color: var(--primary);' : ''}" onclick="openClientAnamnesis('${client.id}', '${escapeJsAttr(client.full_name)}')">🩺 Anamnesi</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientWorkouts('${client.id}', '${escapeJsAttr(client.full_name)}')">📋 Schede</button>
        <button class="btn btn-outline btn-sm" style="${hasPendingVideos ? 'border-color: #38bdf8; color: #38bdf8;' : ''}" onclick="viewClientProgress('${client.id}', '${escapeJsAttr(client.full_name)}')">📊 Progressi${hasPendingVideos ? ' 🎥' : ''}</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientStats('${client.id}', '${escapeJsAttr(client.full_name)}')">📈 Statistiche</button>
        <button class="btn btn-primary btn-sm" onclick="openBuilderForClient('${client.id}', '${escapeJsAttr(client.full_name)}')">Crea Scheda</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadTrainerClients() {
  const [{ data: clients, error }, { data: systemNotifs }] = await Promise.all([
    supabaseClient
      .from('profiles')
      .select('*')
      .eq('trainer_id', currentProfile.id),
    supabaseClient
      .from('trainer_notifications')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .is('seen_at', null)
      .order('created_at', { ascending: false }),
    typeof fetchTrainerAnamnesisAndExternalWorkouts === "function"
      ? fetchTrainerAnamnesisAndExternalWorkouts()
      : Promise.resolve()
  ]);

  if (typeof renderExternalAthletesList === "function") {
    renderExternalAthletesList();
  }

  const select = document.getElementById("builderAthleteSelect");
  const coachAlerts = [];

  (systemNotifs || []).forEach(n => {
    coachAlerts.push({
      level: n.type === 'athlete_linked' ? 'info' : 'danger',
      title: escapeHtml(n.title),
      message: escapeHtml(n.message),
      actionHtml: `<button class="btn btn-outline btn-sm" onclick="markTrainerNotificationSeen('${n.id}')">Segna come letto</button>`
    });
  });

  if (error || !clients || clients.length === 0) {
    enrichedClientsCache = [];
    renderConnectedClientsList();
    select.innerHTML = `<option value="">-- Nessun atleta collegato (Solo PDF) --</option>`;
    if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();
    updateNotificationCenter(coachAlerts);
    return;
  }

  trainerClients = clients;

  select.innerHTML = `<option value="">-- Nessun atleta collegato (Solo PDF) --</option>` +
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (${c.email})</option>`).join("");
  if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();

  const clientIds = clients.map(c => c.id);

  const [{ data: workouts }, { data: unreadLogs }, { data: unreviewedCheckins }, { data: pendingVideos }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('id, athlete_id, end_date, status')
      .eq('trainer_id', currentProfile.id)
      .eq('status', 'active'),
    supabaseClient
      .from('workout_logs')
      .select('id, athlete_id, logged_at, athlete_notes')
      .in('athlete_id', clientIds)
      .is('trainer_seen_at', null)
      .order('logged_at', { ascending: false }),
    supabaseClient
      .from('weekly_checkins')
      .select('id, athlete_id, checkin_date')
      .eq('trainer_id', currentProfile.id)
      .is('reviewed_at', null)
      .order('checkin_date', { ascending: false }),
    supabaseClient
      .from('exercise_video_feedbacks')
      .select('id, athlete_id, exercise_name')
      .eq('coach_id', currentProfile.id)
      .eq('status', 'pending')
  ]);

  const today = new Date();
  const enrichedClients = [];
  const anamList = (typeof trainerAnamnesisList !== "undefined") ? trainerAnamnesisList : [];

  clients.forEach(client => {
    const activeWorkout = (workouts || []).find(w => w.athlete_id === client.id);
    const hasAnamnesis = anamList.some(a => a.athlete_id === client.id);
    let badgeHtml = `<span class="status-badge status-none">Nessuna scheda attiva</span>`;
    let priority = 2;

    if (!activeWorkout) {
      coachAlerts.push({
        level: "warning",
        title: `${escapeHtml(client.full_name)} — Nessuna scheda`,
        message: "Questo atleta non ha ancora una scheda attiva assegnata.",
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeJsAttr(client.full_name)}')">Assegna Ora</button>`
      });
    } else if (activeWorkout.end_date) {
      const end = new Date(activeWorkout.end_date);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        priority = 0;
        badgeHtml = `<span class="status-badge status-expired">Scaduta il ${end.toLocaleDateString('it-IT')}</span>`;
        coachAlerts.push({
          level: "danger",
          title: `⚠️ Scaduta: ${escapeHtml(client.full_name)}`,
          message: `La scheda è scaduta da ${Math.abs(diffDays)} giorni (${end.toLocaleDateString('it-IT')}).`,
          actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeJsAttr(client.full_name)}')">Rinnova</button>`
        });
      } else if (diffDays <= 5) {
        priority = 1;
        badgeHtml = `<span class="status-badge status-expiring">Scade tra ${diffDays} gg (${end.toLocaleDateString('it-IT')})</span>`;
        coachAlerts.push({
          level: "warning",
          title: `⏳ In scadenza: ${escapeHtml(client.full_name)}`,
          message: `La scheda scade tra ${diffDays} giorni (${end.toLocaleDateString('it-IT')}).`,
          actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeJsAttr(client.full_name)}')">Prepara Nuova</button>`
        });
      } else {
        priority = 3;
        badgeHtml = `<span class="status-badge status-active">Attiva fino al ${end.toLocaleDateString('it-IT')}</span>`;
      }
    }

    const clientUnreadLogs = (unreadLogs || []).filter(l => l.athlete_id === client.id);
    if (clientUnreadLogs.length > 0) {
      const hasNotes = clientUnreadLogs.some(l => l.athlete_notes);
      coachAlerts.push({
        level: "info",
        title: `Nuove modifiche da ${escapeHtml(client.full_name)}`,
        message: `L'atleta ha aggiornato la scheda${hasNotes ? ' e inserito nuove note' : ''}.`,
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); viewClientProgress('${client.id}', '${escapeJsAttr(client.full_name)}')">Apri e Segna Letto</button>`
      });
    }

    const clientNewCheckins = (unreviewedCheckins || []).filter(c => c.athlete_id === client.id);
    if (clientNewCheckins.length > 0) {
      coachAlerts.push({
        level: "info",
        title: `✅ Nuovo Check-in da ${escapeHtml(client.full_name)}`,
        message: `Report settimanale inviato e in attesa di tua revisione.`,
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openTrainerAthleteCheckins('${client.id}', '${escapeJsAttr(client.full_name)}')">Apri Check-in</button>`
      });
    }

    const clientPendingVideos = (pendingVideos || []).filter(v => v.athlete_id === client.id);
    if (clientPendingVideos.length > 0) {
      coachAlerts.push({
        level: "info",
        title: `🎥 Video da revisionare: ${escapeHtml(client.full_name)}`,
        message: `${clientPendingVideos.length} video esecuzione in attesa della tua nota tecnica.`,
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); viewClientProgress('${client.id}', '${escapeJsAttr(client.full_name)}')">Guarda Video</button>`
      });
    }

    enrichedClients.push({
      client,
      badgeHtml,
      priority,
      hasUnreadUpdate: clientUnreadLogs.length > 0,
      hasUnreviewedCheckin: clientNewCheckins.length > 0,
      hasPendingVideos: clientPendingVideos.length > 0,
      hasAnamnesis
    });
  });

  enrichedClients.sort((a, b) => a.priority - b.priority);
  enrichedClientsCache = enrichedClients;
  renderConnectedClientsList();

  updateNotificationCenter(coachAlerts);
}

// ============================================================
// STORICO SCHEDE ATLETA (CARICAMENTO LEGGERO + LAZY LOADING)
// ============================================================

function renderWorkoutDaysHtml(items) {
  if (!items || items.length === 0) {
    return '<span style="font-size: 0.8rem; color: var(--text-muted);">Nessun esercizio salvato.</span>';
  }

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_name]) grouped[item.day_name] = [];
    grouped[item.day_name].push(item);
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(dayName => {
      const dayItems = grouped[dayName];
      let inCircuit = false;
      let circuitBuffer = "";
      let circuitTitle = "CIRCUITO";
      let dayContent = "";

      dayItems.forEach((row, idx) => {
        const exFromMap = (typeof EXERCISE_MAP !== "undefined") ? EXERCISE_MAP.get(row.exercise_id) : null;
        const ex = row.exercises || exFromMap;
        const start = ex ? (ex.img_start || "") : "";
        const end = ex ? (ex.img_end || ex.img_start || "") : "";
        const isSingle = start === end;

        const roleBadge = row.circuit_role === 'start'
          ? `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 INIZIO CIRCUITO</span>`
          : row.circuit_role === 'end'
            ? `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🏁 FINE CIRCUITO</span>`
            : row.circuit_role === 'single'
              ? `<span style="display:inline-block; font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 6px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 BLOCCO CIRCUITO</span>`
              : '';

        const rowHtml = `
          <div class="exercise-item">
            <div class="exercise-top">
              <div class="item-photos">
                ${start ? (isSingle ? `
                  <img src="${start}" loading="lazy" decoding="async" class="item-img" style="width: 82px; object-fit: contain;">
                ` : `
                  <img src="${start}" loading="lazy" decoding="async" class="item-img">
                  <img src="${end}" loading="lazy" decoding="async" class="item-img">
                `) : ''}
              </div>
              <div class="item-details">
                <strong>${idx + 1}. ${escapeHtml(ex ? ex.name : 'Esercizio')}</strong> ${roleBadge}
                <div class="item-sub"><strong>${escapeHtml(row.sets_reps)}</strong> | Rest: ${escapeHtml(row.rest)} | RIR/@: ${escapeHtml(row.rir)}</div>
                ${row.notes && row.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(row.notes)}</div>` : ''}
              </div>
            </div>
          </div>
        `;

        if (row.circuit_role === 'single') {
          if (inCircuit) {
            dayContent += `<div class="circuit-group-box"><div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitTitle)}</span><span>INIZIO CIRCUITO</span></div>${circuitBuffer}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
            inCircuit = false;
            circuitBuffer = "";
          }
          const lbl = row.circuit_label || "BLOCCO CIRCUITO";
          dayContent += `<div class="circuit-group-box"><div class="circuit-group-header"><span>🔄 ${escapeHtml(lbl)}</span><span>CIRCUITO</span></div>${rowHtml}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
        } else if (row.circuit_role === 'start') {
          if (inCircuit) {
            dayContent += `<div class="circuit-group-box"><div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitTitle)}</span><span>INIZIO CIRCUITO</span></div>${circuitBuffer}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
          }
          inCircuit = true;
          circuitTitle = row.circuit_label || "CIRCUITO";
          circuitBuffer = rowHtml;
        } else if (row.circuit_role === 'end' && inCircuit) {
          circuitBuffer += rowHtml;
          dayContent += `<div class="circuit-group-box"><div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitTitle)}</span><span>INIZIO CIRCUITO</span></div>${circuitBuffer}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
          inCircuit = false;
          circuitBuffer = "";
        } else if (inCircuit) {
          circuitBuffer += rowHtml;
        } else {
          dayContent += rowHtml;
        }
      });

      if (inCircuit) {
        dayContent += `<div class="circuit-group-box" style="border-style: dashed;"><div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitTitle)}</span><span>INIZIO CIRCUITO</span></div>${circuitBuffer}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
      }

      return `
        <div class="day-group" style="margin-top: 8px;">
          <div class="day-badge">
            📅 ${escapeHtml(dayName)} (${dayItems.length} ESERCIZI)
          </div>
          ${dayContent}
        </div>
      `;
    }).join("");
}

async function fetchWorkoutExercisesFast(workoutId) {
  if (loadedWorkoutExercisesCache.has(workoutId)) {
    return loadedWorkoutExercisesCache.get(workoutId);
  }

  const hasLocalMap = typeof EXERCISE_MAP !== "undefined" && EXERCISE_MAP.size > 0;
  const selectFields = hasLocalMap
    ? 'id, workout_id, exercise_id, day_name, sets_reps, rest, rir, notes, order_index, circuit_role, circuit_label, weekly_progression'
    : 'id, workout_id, exercise_id, day_name, sets_reps, rest, rir, notes, order_index, circuit_role, circuit_label, weekly_progression, exercises(name, muscle, img_start, img_end)';

  const { data: rows, error } = await supabaseClient
    .from('workout_exercises')
    .select(selectFields)
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (error || !rows) return [];
  loadedWorkoutExercisesCache.set(workoutId, rows);
  return rows;
}

window.loadLazyWorkoutExercises = async function(workoutId) {
  const targetEl = document.getElementById(`workoutExBody_${workoutId}`);
  const summaryEl = document.getElementById(`workoutExSummary_${workoutId}`);
  if (!targetEl || targetEl.dataset.loaded === "1") return;

  targetEl.dataset.loaded = "1";
  targetEl.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); padding: 6px;">Caricamento esercizi...</div>`;

  const items = await fetchWorkoutExercisesFast(workoutId);
  if (summaryEl) {
    summaryEl.textContent = `Mostra esercizi (${items.length})`;
  }
  targetEl.innerHTML = renderWorkoutDaysHtml(items);
};

window.viewClientWorkouts = async function(clientId, clientName) {
  showTrainerView("trainerWorkoutsView");
  document.getElementById("workoutsAthleteTitle").textContent = `📋 Schede: ${clientName}`;
  const container = document.getElementById("athleteWorkoutsHistoryContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento schede...</div>`;

  // Query leggera sulle sole intestazioni delle ultime 25 schede (senza join annidati pesanti)
  const [{ data: clientWorkouts, error }, { data: unlinkedDrafts }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('id, title, status, duration_weeks, start_date, end_date, general_notes, created_at')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .order('created_at', { ascending: false })
      .limit(25),
    supabaseClient
      .from('workouts')
      .select('id, title, status, duration_weeks, start_date, end_date, general_notes, created_at')
      .eq('trainer_id', currentProfile.id)
      .eq('status', 'draft')
      .is('athlete_id', null)
      .ilike('title', clientName.trim())
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const combinedMap = new Map();
  (clientWorkouts || []).forEach(w => combinedMap.set(w.id, w));
  (unlinkedDrafts || []).forEach(w => combinedMap.set(w.id, w));
  const workouts = Array.from(combinedMap.values());

  if (error || workouts.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda o bozza trovata per ${escapeHtml(clientName)}.</div>`;
    return;
  }

  const statusWeight = { draft: 0, active: 1, archived: 2 };
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const wa = statusWeight[a.status] ?? 2;
    const wb = statusWeight[b.status] ?? 2;
    if (wa !== wb) return wa - wb;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Pre-carica subito SOLO la scheda attiva (se esiste) in parallelo al rendering
  const activeWorkout = sortedWorkouts.find(w => w.status === 'active');
  const activeItemsPromise = activeWorkout
    ? fetchWorkoutExercisesFast(activeWorkout.id)
    : Promise.resolve([]);

  container.innerHTML = "";
  const archivedList = sortedWorkouts.filter(w => w.status === 'archived');

  sortedWorkouts.forEach((w) => {
    const isDraft = w.status === 'draft';
    const isActive = w.status === 'active';
    const createdStr = new Date(w.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    const box = document.createElement("div");

    if (isDraft) {
      box.style.cssText = `background: var(--subcard-bg); color: var(--text); border: 1.5px solid var(--primary); border-radius: 8px; padding: 12px; margin-bottom: 12px;`;
      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
          <div>
            <span class="status-badge status-expiring" style="margin-top: 0; margin-bottom: 4px;">
              📝 BOZZA IN LAVORAZIONE
            </span>
            <div style="font-size: 0.84rem; color: var(--text); font-weight: 700;">
              Durata prevista: ${w.duration_weeks} sett. • Salvata il ${createdStr}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="resumeDraft('${w.id}')">
              ✏️ Riprendi
            </button>
            <button class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteClientWorkout('${w.id}', '${clientId}', '${escapeJsAttr(clientName)}')">
              🗑️ Cancella
            </button>
          </div>
        </div>
      `;
      container.appendChild(box);
      return;
    }

    const startStr = w.start_date ? new Date(w.start_date).toLocaleDateString('it-IT') : '-';
    const endStr = w.end_date ? new Date(w.end_date).toLocaleDateString('it-IT') : '-';

    box.style.cssText = `background: var(--subcard-bg); color: var(--text); border: 1.5px solid ${isActive ? 'var(--success)' : 'var(--border)'}; border-radius: 8px; padding: 12px; margin-bottom: 12px;`;

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
        <div>
          <span class="status-badge ${isActive ? 'status-active' : 'status-none'}" style="margin-top: 0; margin-bottom: 4px;">
            ${isActive ? '● SCHEDA ATTIVA' : `ARCHIVIATA #${archivedList.length - archivedList.indexOf(w)}`}
          </span>
          <div style="font-size: 0.84rem; color: var(--text); font-weight: 700;">
            Dal ${startStr} al ${endStr} (${w.duration_weeks} sett.)
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="cloneWorkoutToBuilder('${w.id}', '${clientId}', '${escapeJsAttr(clientName)}')">
            📥 Carica nel Builder
          </button>
          <button class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteClientWorkout('${w.id}', '${clientId}', '${escapeJsAttr(clientName)}')">
            🗑️ Elimina
          </button>
        </div>
      </div>

      ${w.general_notes ? `<div style="background: var(--notes-bg); color: var(--notes-text); border: 1px solid var(--border); padding: 7px 9px; border-radius: 6px; font-size: 0.8rem; margin-top: 8px; white-space: pre-wrap;"><strong>Note generali:</strong> ${escapeHtml(w.general_notes)}</div>` : ''}

      <details ${isActive ? 'open' : ''} ontoggle="if(this.open) loadLazyWorkoutExercises('${w.id}')" style="margin-top: 8px;">
        <summary id="workoutExSummary_${w.id}" style="cursor: pointer; font-size: 0.82rem; color: var(--primary); font-weight: 700;">
          Mostra esercizi
        </summary>
        <div id="workoutExBody_${w.id}" data-loaded="${isActive ? '1' : '0'}" class="exercise-list" style="margin-top: 6px;">
          ${isActive ? '<div style="font-size: 0.78rem; color: var(--text-muted); padding: 6px;">Caricamento esercizi...</div>' : ''}
        </div>
      </details>
    `;

    container.appendChild(box);
  });

  if (activeWorkout) {
    const activeItems = await activeItemsPromise;
    const targetEl = document.getElementById(`workoutExBody_${activeWorkout.id}`);
    const summaryEl = document.getElementById(`workoutExSummary_${activeWorkout.id}`);
    if (summaryEl) summaryEl.textContent = `Mostra esercizi (${activeItems.length})`;
    if (targetEl) targetEl.innerHTML = renderWorkoutDaysHtml(activeItems);
  }
};

window.deleteClientWorkout = async function(workoutId, clientId, clientName) {
  if (!confirm("Vuoi eliminare definitivamente questa scheda? L'azione non è reversibile.")) return;

  await supabaseClient.from('workout_exercises').delete().eq('workout_id', workoutId);

  const { error } = await supabaseClient
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('trainer_id', currentProfile.id);

  if (error) {
    alert("Errore durante l'eliminazione della scheda: " + error.message);
    return;
  }

  loadedWorkoutExercisesCache.delete(workoutId);

  if (typeof currentDraftId !== "undefined" && currentDraftId === workoutId) {
    currentDraftId = null;
  }

  await viewClientWorkouts(clientId, clientName);
  await loadTrainerClients();
};

window.cloneWorkoutToBuilder = async function(workoutId, clientId, clientName) {
  const [{ data: workout, error }, items] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('id, duration_weeks, general_notes')
      .eq('id', workoutId)
      .single(),
    fetchWorkoutExercisesFast(workoutId)
  ]);

  if (error || !workout) {
    alert("Errore nel caricamento della scheda.");
    return;
  }

  if (typeof currentDraftId !== "undefined") currentDraftId = null;
  openBuilderForClient(clientId, clientName);
  document.getElementById("durationWeeks").value = workout.duration_weeks || 4;
  document.getElementById("generalNotes").value = workout.general_notes || "";

  currentWorkout = items.map((row, idx) => {
    const exFromMap = (typeof EXERCISE_MAP !== "undefined") ? EXERCISE_MAP.get(row.exercise_id) : null;
    const ex = row.exercises || exFromMap;
    const base = {
      uid: Date.now() + idx,
      id: row.exercise_id,
      day: row.day_name,
      name: ex ? ex.name : "Esercizio",
      muscle: ex ? ex.muscle : "",
      imgStart: ex ? (ex.img_start || "") : "",
      imgEnd: ex ? (ex.img_end || ex.img_start || "") : "",
      setsReps: row.sets_reps,
      rest: row.rest,
      rir: row.rir,
      notes: row.notes,
      circuitRole: row.circuit_role || null,
      circuitLabel: row.circuit_label || "",
      weeklyProgression: null
    };
    // Mantiene la progressione settimanale quando si clona un mesociclo
    base.weeklyProgression = typeof normalizeWeeklyProgression === "function"
      ? normalizeWeeklyProgression(row.weekly_progression, base)
      : null;
    return base;
  });

  if (typeof applyProgrammingModeFromItems === "function") {
    applyProgrammingModeFromItems(workout.duration_weeks);
  }
  renderList();
};

window.viewClientProgress = async function(clientId, clientName, selectedWorkoutId = null) {
  showTrainerView("trainerProgressView");
  document.getElementById("progressAthleteTitle").textContent = `📊 Progressi: ${clientName}`;
  const container = document.getElementById("progressLogsContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento schede e riscontri atleta...</div>`;

  const [{ data: allWorkouts }, { data: logs }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('id, title, status, duration_weeks, start_date, end_date, general_notes, created_at')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .in('status', ['active', 'archived'])
      .order('created_at', { ascending: false })
      .limit(25),
    supabaseClient
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', clientId)
      .order('logged_at', { ascending: false })
  ]);

  const unseenIdsSet = new Set((logs || []).filter(l => !l.trainer_seen_at).map(l => l.id));

  if (unseenIdsSet.size > 0) {
    supabaseClient
      .from('workout_logs')
      .update({ trainer_seen_at: new Date().toISOString() })
      .eq('athlete_id', clientId)
      .is('trainer_seen_at', null)
      .then(() => loadTrainerClients());
  }

  const workoutsList = allWorkouts || [];
  if (workoutsList.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda attiva o archiviata trovata per ${escapeHtml(clientName)}.</div>`;
    return;
  }

  const sortedWorkouts = [...workoutsList].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const targetWorkout = selectedWorkoutId
    ? (sortedWorkouts.find(w => w.id === selectedWorkoutId) || sortedWorkouts[0])
    : sortedWorkouts[0];

  const isTargetActive = targetWorkout.status === 'active';

  let archivedIdx = sortedWorkouts.filter(w => w.status === 'archived').length;
  const selectorOptionsHtml = sortedWorkouts.map(w => {
    const sDate = w.start_date ? new Date(w.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
    const eDate = w.end_date ? new Date(w.end_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
    let label = "";
    if (w.status === 'active') {
      label = `● ATTIVA — ${w.title || 'Scheda'} (${sDate} → ${eDate})`;
    } else {
      label = `📁 ARCHIVIATA #${archivedIdx--} — ${w.title || 'Scheda'} (${sDate} → ${eDate})`;
    }
    return `<option value="${w.id}" ${w.id === targetWorkout.id ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join("");

  const [items, { data: workoutVideos }] = await Promise.all([
    fetchWorkoutExercisesFast(targetWorkout.id),
    supabaseClient
      .from('exercise_video_feedbacks')
      .select('*')
      .eq('workout_id', targetWorkout.id)
      .order('created_at', { ascending: false })
  ]);

  const startStr = targetWorkout.start_date ? new Date(targetWorkout.start_date).toLocaleDateString('it-IT') : '-';
  const endStr = targetWorkout.end_date ? new Date(targetWorkout.end_date).toLocaleDateString('it-IT') : '-';

  let html = `
    <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
      <label style="font-size: 0.74rem; color: var(--text-muted); display: block; margin-bottom: 4px;">
        Seleziona Scheda da consultare (${sortedWorkouts.length} totali):
      </label>
      <select id="progressWorkoutSelector" style="width: 100%; font-size: 0.82rem; font-weight: 600;">
        ${selectorOptionsHtml}
      </select>
      <div style="font-size: 0.78rem; color: ${isTargetActive ? 'var(--primary)' : 'var(--text-muted)'}; margin-top: 6px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <span>Periodo: <strong>${startStr} – ${endStr}</strong> (${targetWorkout.duration_weeks} sett.)</span>
        <span>${isTargetActive ? '🟢 Scheda in corso' : '📁 Storico archiviato'}</span>
      </div>
    </div>
  `;

  if (!items || items.length === 0) {
    container.innerHTML = html + `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Questa scheda non contiene esercizi.</div>`;
    const selEl = document.getElementById("progressWorkoutSelector");
    if (selEl) selEl.addEventListener("change", (e) => viewClientProgress(clientId, clientName, e.target.value));
    return;
  }

  if (targetWorkout.general_notes) {
    html += `<div style="background: var(--notes-bg); color: var(--notes-text); border: 1px solid var(--border); padding: 10px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 12px; white-space: pre-wrap;"><strong>NOTE ASSEGNATE:</strong>\n${escapeHtml(targetWorkout.general_notes)}</div>`;
  }

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_name]) grouped[item.day_name] = [];
    grouped[item.day_name].push(item);
  });

  const isMultiWeekWorkout = (parseInt(targetWorkout.duration_weeks, 10) || 1) > 1 &&
    items.some(it => it.weekly_progression && typeof it.weekly_progression === "object" && Object.keys(it.weekly_progression).length > 0);

  html += `<div class="exercise-list">`;

  Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(dayName => {
      html += `<div class="day-group"><div class="day-badge">📅 ${escapeHtml(dayName)}</div>`;

      grouped[dayName].forEach((row, idx) => {
        const exFromMap = (typeof EXERCISE_MAP !== "undefined") ? EXERCISE_MAP.get(row.exercise_id) : null;
        const ex = row.exercises || exFromMap;
        const start = ex ? (ex.img_start || "") : "";
        const end = ex ? (ex.img_end || ex.img_start || "") : "";
        const rawExLogs = (logs || []).filter(l => l.workout_exercise_id === row.id);
        const dailyLogs = consolidateTrainerLogsByDay(rawExLogs, unseenIdsSet);
        if (isMultiWeekWorkout) dailyLogs.forEach(d => { d.showWeek = true; });
        const latest = dailyLogs[0];

        const exVideos = (workoutVideos || []).filter(v => v.exercise_index === row.order_index);
        const videoBoxHtml = typeof buildTrainerVideoFeedbackHtml === "function"
          ? buildTrainerVideoFeedbackHtml(exVideos, clientId, clientName, targetWorkout.id)
          : "";

        let feedbackHtml = "";
        if (!latest) {
          feedbackHtml = `
            <div class="athlete-feedback-box empty">
              Nessun dato registrato dall'atleta per questo esercizio in questa scheda.
            </div>
          `;
        } else {
          const latestFresh = isFreshOrTodayLog(latest);
          const latestDate = new Date(latest.logged_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const latestSummary = formatTrainerLogSummaryHtml(latest, latestDate, clientName);
          const latestBoxExtraStyle = latestFresh ? "margin-top:0; white-space: pre-wrap;" : `margin-top:0; white-space: pre-wrap; ${getOlderYellowBoxStyle()}`;
          const outerBorderStyle = latestFresh ? "" : "border-left-color: #f59e0b;";
          const latestCoachHtml = buildTrainerCoachNoteHtml(latest);

          const olderHtml = dailyLogs.length > 1 ? `
            <details class="past-logs-details">
              <summary>Vedi giorni precedenti (${dailyLogs.length - 1})</summary>
              <div style="margin-top: 5px; display: flex; flex-direction: column; gap: 5px;">
                ${dailyLogs.slice(1).map(old => {
                  const oldFresh = isFreshOrTodayLog(old);
                  const d = new Date(old.logged_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  const oldSummary = formatTrainerLogSummaryHtml(old, d, clientName);
                  const oldStyle = oldFresh ? "margin-top:0; white-space: pre-wrap;" : `margin-top:0; white-space: pre-wrap; ${getOlderYellowBoxStyle()}`;
                  const nCoach = buildTrainerCoachNoteHtml(old, "3px");
                  return `
                    <div style="border-top: 1px dashed var(--border); padding-top: 4px;">
                      <div class="note-athlete-box" style="${oldStyle}">${oldSummary}</div>
                      ${nCoach}
                    </div>
                  `;
                }).join("")}
              </div>
            </details>
          ` : "";

          const replyFormHtml = isTargetActive ? `
            <div class="coach-reply-form" style="align-items: flex-end;">
              <textarea id="coachReplyInput_${latest.id}" rows="2" placeholder="Aggiungi messaggio del coach..." style="flex: 1; min-height: 44px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;"></textarea>
              <button type="button" class="btn btn-sm" style="background:#ef4444; color:#fff; width:auto; flex-shrink:0; align-self: stretch;" onclick="saveCoachNoteOnLog('${latest.id}', '${clientId}', '${escapeJsAttr(clientName)}')">Invia</button>
            </div>
          ` : "";

          feedbackHtml = `
            <div class="athlete-feedback-box" style="${outerBorderStyle}">
              <div class="note-athlete-box" style="${latestBoxExtraStyle}">${latestSummary}</div>
              ${latestCoachHtml}
              ${replyFormHtml}
              ${olderHtml}
            </div>
          `;
        }

        html += `
          <div class="exercise-item">
            <div class="progress-split">
              <div class="exercise-top">
                <div class="item-photos">
                  ${start ? (start === end ? `
                    <img src="${start}" loading="lazy" decoding="async" class="item-img" style="width: 82px; object-fit: contain;">
                  ` : `
                    <img src="${start}" loading="lazy" decoding="async" class="item-img">
                    <img src="${end}" loading="lazy" decoding="async" class="item-img">
                  `) : ''}
                </div>
                <div class="item-details">
                  <strong>${idx + 1}. ${escapeHtml(ex ? ex.name : 'Esercizio')}</strong>
                  <div class="item-sub"><strong>${escapeHtml(row.sets_reps)}</strong> | Rest: ${escapeHtml(row.rest)} | Target RIR/@: ${escapeHtml(row.rir)}</div>
                  ${row.notes && row.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(row.notes)}</div>` : ''}
                </div>
              </div>
              ${feedbackHtml}
              ${videoBoxHtml}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

  html += `</div>`;
  container.innerHTML = html;

  const selEl = document.getElementById("progressWorkoutSelector");
  if (selEl) {
    selEl.addEventListener("change", (e) => {
      viewClientProgress(clientId, clientName, e.target.value);
    });
  }
};

window.saveCoachNoteOnLog = async function(logId, clientId, clientName) {
  const inputEl = document.getElementById(`coachReplyInput_${logId}`);
  if (!inputEl) return;
  const newNote = inputEl.value.trim();

  if (!newNote) {
    alert("Scrivi un messaggio prima di inviare.");
    return;
  }

  const { data: currentLog, error: fetchErr } = await supabaseClient
    .from('workout_logs')
    .select('coach_notes')
    .eq('id', logId)
    .single();

  if (fetchErr) {
    alert("Errore lettura messaggio precedente: " + fetchErr.message);
    return;
  }

  const prevNotes = (currentLog?.coach_notes || "").trim();
  const combinedNotes = prevNotes ? `${prevNotes}\n${newNote}` : newNote;

  const { data, error } = await supabaseClient
    .from('workout_logs')
    .update({
      coach_notes: combinedNotes,
      coach_replied_at: new Date().toISOString(),
      athlete_seen_at: null
    })
    .eq('id', logId)
    .select();

  if (error) {
    alert("Errore invio nota coach: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("⚠️ Supabase ha bloccato il salvataggio (permessi RLS). Esegui la query SQL di permesso UPDATE su workout_logs.");
    return;
  }

  await viewClientProgress(clientId, clientName);
};

window.openBuilderForClient = function(clientId, clientName) {
  showTrainerView("trainerBuilderView");
  if (typeof loadTrainerDrafts === "function") loadTrainerDrafts();
  document.getElementById("builderAthleteSelect").value = clientId;
  document.getElementById("athleteName").value = clientName;
  document.getElementById("btnLoadExistingWorkout").classList.remove("hidden");
  if (typeof syncSaveCloudButtonState === "function") syncSaveCloudButtonState();
};
