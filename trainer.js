let trainerAnamnesisList = [];

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

function showTrainerView(viewId) {
  document.getElementById("trainerClientsView").classList.add("hidden");
  document.getElementById("trainerBuilderView").classList.add("hidden");
  document.getElementById("trainerProgressView").classList.add("hidden");
  document.getElementById("trainerWorkoutsView").classList.add("hidden");
  document.getElementById("trainerStatsView").classList.add("hidden");
  document.getElementById("trainerAnamnesisView").classList.add("hidden");
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
});

document.getElementById("btnBackToClients").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
  loadTrainerClients();
});

document.getElementById("btnBackFromWorkouts").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
});

document.getElementById("btnBackFromAnamnesis").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
  loadTrainerClients();
});

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

function renderExternalAnamnesisList() {
  const container = document.getElementById("externalAnamnesisListContainer");
  if (!container) return;

  const externalRecords = (trainerAnamnesisList || []).filter(a => !a.athlete_id);

  if (externalRecords.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Nessuna anamnesi esterna salvata.</div>`;
    return;
  }

  container.innerHTML = "";
  externalRecords.forEach(rec => {
    const updatedStr = rec.updated_at
      ? new Date(rec.updated_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : '';
    const subParts = [];
    if (rec.goal) subParts.push(rec.goal);
    if (rec.availability) subParts.push(rec.availability);
    const subLine = subParts.length > 0 ? subParts.join(" • ") : "Scheda anamnesi salvata";

    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div>
        <strong style="font-size: 0.92rem; display: block;">
          ${escapeHtml(rec.full_name)}
          <span style="font-size: 0.68rem; background: rgba(59, 130, 246, 0.16); color: var(--primary); padding: 1px 6px; border-radius: 4px; margin-left: 4px;">Esterno</span>
        </strong>
        <span style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-top: 2px;">
          ${escapeHtml(subLine)}${updatedStr ? ` • Agg. ${updatedStr}` : ''}
        </span>
      </div>
      <div class="client-actions">
        <button type="button" class="btn btn-outline btn-sm" onclick="openExternalAnamnesis('${rec.id}')">🩺 Apri</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="openBuilderForExternal('${escapeHtml(rec.full_name)}')">Crea Scheda</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadTrainerClients() {
  const [{ data: clients, error }, { data: systemNotifs }, { data: allAnamnesis }] = await Promise.all([
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
    supabaseClient
      .from('athlete_anamnesis')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .order('updated_at', { ascending: false })
  ]);

  trainerAnamnesisList = allAnamnesis || [];
  renderExternalAnamnesisList();

  const container = document.getElementById("clientsListContainer");
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
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessun atleta ancora collegato. Condividi il tuo Codice Invito!</div>`;
    document.getElementById("clientsCount").textContent = "0 atleti";
    select.innerHTML = `<option value="">-- Nessun atleta collegato (Solo PDF) --</option>`;
    updateNotificationCenter(coachAlerts);
    return;
  }

  trainerClients = clients;
  document.getElementById("clientsCount").textContent = `${clients.length} atleti`;

  select.innerHTML = `<option value="">-- Nessun atleta collegato (Solo PDF) --</option>` +
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (${c.email})</option>`).join("");

  const clientIds = clients.map(c => c.id);

  const [{ data: workouts }, { data: unreadLogs }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .eq('status', 'active'),
    supabaseClient
      .from('workout_logs')
      .select('id, athlete_id, logged_at, athlete_notes')
      .in('athlete_id', clientIds)
      .is('trainer_seen_at', null)
      .order('logged_at', { ascending: false })
  ]);

  container.innerHTML = "";
  const today = new Date();
  const enrichedClients = [];

  clients.forEach(client => {
    const activeWorkout = (workouts || []).find(w => w.athlete_id === client.id);
    const hasAnamnesis = trainerAnamnesisList.some(a => a.athlete_id === client.id);
    let badgeHtml = `<span class="status-badge status-none">Nessuna scheda attiva</span>`;
    let priority = 2;

    if (!activeWorkout) {
      coachAlerts.push({
        level: "warning",
        title: `${escapeHtml(client.full_name)} — Nessuna scheda`,
        message: "Questo atleta non ha ancora una scheda attiva assegnata.",
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeHtml(client.full_name)}')">Assegna Ora</button>`
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
          actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeHtml(client.full_name)}')">Rinnova</button>`
        });
      } else if (diffDays <= 5) {
        priority = 1;
        badgeHtml = `<span class="status-badge status-expiring">Scade tra ${diffDays} gg (${end.toLocaleDateString('it-IT')})</span>`;
        coachAlerts.push({
          level: "warning",
          title: `⏳ In scadenza: ${escapeHtml(client.full_name)}`,
          message: `La scheda scade tra ${diffDays} giorni (${end.toLocaleDateString('it-IT')}).`,
          actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); openBuilderForClient('${client.id}', '${escapeHtml(client.full_name)}')">Prepara Nuova</button>`
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
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); viewClientProgress('${client.id}', '${escapeHtml(client.full_name)}')">Apri e Segna Letto</button>`
      });
    }

    enrichedClients.push({ client, badgeHtml, priority, hasUnreadUpdate: clientUnreadLogs.length > 0, hasAnamnesis });
  });

  enrichedClients.sort((a, b) => a.priority - b.priority);

  enrichedClients.forEach(({ client, badgeHtml, hasUnreadUpdate, hasAnamnesis }) => {
    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div>
        <strong style="font-size: 0.95rem; display: block;">
          ${escapeHtml(client.full_name)}
          ${hasUnreadUpdate ? '<span style="font-size:0.7rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; margin-left:4px;">● Da vedere</span>' : ''}
        </strong>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(client.email)}</span><br>
        ${badgeHtml}
      </div>
      <div class="client-actions">
        <button class="btn btn-outline btn-sm" style="${hasAnamnesis ? 'border-color: var(--primary); color: var(--primary);' : ''}" onclick="openClientAnamnesis('${client.id}', '${escapeHtml(client.full_name)}')">🩺 Anamnesi</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientWorkouts('${client.id}', '${escapeHtml(client.full_name)}')">📋 Schede</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientProgress('${client.id}', '${escapeHtml(client.full_name)}')">📊 Progressi</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientStats('${client.id}', '${escapeHtml(client.full_name)}')">📈 Statistiche</button>
        <button class="btn btn-primary btn-sm" onclick="openBuilderForClient('${client.id}', '${escapeHtml(client.full_name)}')">Crea Scheda</button>
      </div>
    `;
    container.appendChild(card);
  });

  updateNotificationCenter(coachAlerts);
}

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
  const metaEl = document.getElementById("anamnesisUpdatedMeta");
  const nameInput = document.getElementById("anamFullName");

  document.getElementById("anamnesisRecordId").value = record ? record.id : (recordId || "");
  document.getElementById("anamnesisAthleteId").value = athleteId || "";

  if (athleteId) {
    titleEl.textContent = `🩺 Anamnesi: ${defaultName}`;
    subtitleEl.textContent = "🔒 Scheda privata riservata al coach • Atleta collegato all'app";
    nameInput.value = record && record.full_name ? record.full_name : defaultName;
  } else {
    titleEl.textContent = record ? `🩺 Anamnesi: ${record.full_name}` : "🩺 Nuova Anamnesi (Atleta Esterno)";
    subtitleEl.textContent = "🔒 Scheda privata riservata al coach • Atleta esterno (Solo PDF)";
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
  } else {
    metaEl.textContent = "Compila i campi e premi Salva Anamnesi.";
    deleteBtn.classList.add("hidden");
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
};

window.viewClientWorkouts = async function(clientId, clientName) {
  showTrainerView("trainerWorkoutsView");
  document.getElementById("workoutsAthleteTitle").textContent = `📋 Schede: ${clientName}`;
  const container = document.getElementById("athleteWorkoutsHistoryContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento schede e bozze...</div>`;

  const [{ data: clientWorkouts, error }, { data: unlinkedDrafts }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('*, workout_exercises(*, exercises(name, muscle, img_start, img_end))')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .order('created_at', { ascending: false }),
    supabaseClient
      .from('workouts')
      .select('*, workout_exercises(*, exercises(name, muscle, img_start, img_end))')
      .eq('trainer_id', currentProfile.id)
      .eq('status', 'draft')
      .is('athlete_id', null)
      .ilike('title', clientName.trim())
      .order('created_at', { ascending: false })
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

  container.innerHTML = "";
  const archivedList = sortedWorkouts.filter(w => w.status === 'archived');

  sortedWorkouts.forEach((w) => {
    const isDraft = w.status === 'draft';
    const isActive = w.status === 'active';
    const createdStr = new Date(w.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    const items = (w.workout_exercises || []).sort((a, b) => a.order_index - b.order_index);

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
            <button class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteClientWorkout('${w.id}', '${clientId}', '${escapeHtml(clientName)}')">
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

    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.day_name]) grouped[item.day_name] = [];
      grouped[item.day_name].push(item);
    });

    const daysHtml = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(dayName => {
        const dayItems = grouped[dayName];
        let inCircuit = false;
        let circuitBuffer = "";
        let circuitTitle = "CIRCUITO";
        let dayContent = "";

        dayItems.forEach((row, idx) => {
          const ex = row.exercises;
          const start = ex ? ex.img_start : "";
          const end = ex ? (ex.img_end || ex.img_start) : "";
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
                    <img src="${start}" class="item-img" style="width: 82px; object-fit: contain;">
                  ` : `
                    <img src="${start}" class="item-img">
                    <img src="${end}" class="item-img">
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
          <button class="btn btn-outline btn-sm" onclick="cloneWorkoutToBuilder('${w.id}', '${clientId}', '${escapeHtml(clientName)}')">
            📥 Carica nel Builder
          </button>
          <button class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger);" onclick="deleteClientWorkout('${w.id}', '${clientId}', '${escapeHtml(clientName)}')">
            🗑️ Elimina
          </button>
        </div>
      </div>

      ${w.general_notes ? `<div style="background: var(--notes-bg); color: var(--notes-text); border: 1px solid var(--border); padding: 7px 9px; border-radius: 6px; font-size: 0.8rem; margin-top: 8px; white-space: pre-wrap;"><strong>Note generali:</strong> ${escapeHtml(w.general_notes)}</div>` : ''}

      <details ${isActive ? 'open' : ''} style="margin-top: 8px;">
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

  if (typeof currentDraftId !== "undefined" && currentDraftId === workoutId) {
    currentDraftId = null;
  }

  await viewClientWorkouts(clientId, clientName);
  await loadTrainerClients();
};

window.cloneWorkoutToBuilder = async function(workoutId, clientId, clientName) {
  const { data: workout, error } = await supabaseClient
    .from('workouts')
    .select('*, workout_exercises(*, exercises(*))')
    .eq('id', workoutId)
    .single();

  if (error || !workout) {
    alert("Errore nel caricamento della scheda.");
    return;
  }

  if (typeof currentDraftId !== "undefined") currentDraftId = null;
  openBuilderForClient(clientId, clientName);
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
};

window.viewClientProgress = async function(clientId, clientName) {
  showTrainerView("trainerProgressView");
  document.getElementById("progressAthleteTitle").textContent = `📊 Progressi: ${clientName}`;
  const container = document.getElementById("progressLogsContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento scheda e riscontri atleta...</div>`;

  const [{ data: workout }, { data: logs }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('*')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabaseClient
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', clientId)
      .order('logged_at', { ascending: false })
  ]);

  const unseenIdsSet = new Set((logs || []).filter(l => !l.trainer_seen_at).map(l => l.id));

  if (unseenIdsSet.size > 0) {
    await supabaseClient
      .from('workout_logs')
      .update({ trainer_seen_at: new Date().toISOString() })
      .eq('athlete_id', clientId)
      .is('trainer_seen_at', null);

    loadTrainerClients();
  }

  if (!workout) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda attiva trovata per ${escapeHtml(clientName)}.</div>`;
    return;
  }

  const { data: items } = await supabaseClient
    .from('workout_exercises')
    .select('*, exercises(*)')
    .eq('workout_id', workout.id)
    .order('order_index', { ascending: true });

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">La scheda attiva non contiene esercizi.</div>`;
    return;
  }

  const endStr = workout.end_date ? new Date(workout.end_date).toLocaleDateString('it-IT') : '-';
  let html = `
    <div style="font-size: 0.8rem; color: var(--primary); margin-bottom: 8px;">
      Durata: ${workout.duration_weeks} settimane • Scadenza: ${endStr}
    </div>
  `;

  if (workout.general_notes) {
    html += `<div style="background: var(--notes-bg); color: var(--notes-text); border: 1px solid var(--border); padding: 10px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 12px; white-space: pre-wrap;"><strong>NOTE ASSEGNATE:</strong>\n${escapeHtml(workout.general_notes)}</div>`;
  }

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.day_name]) grouped[item.day_name] = [];
    grouped[item.day_name].push(item);
  });

  html += `<div class="exercise-list">`;

  Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(dayName => {
      html += `<div class="day-group"><div class="day-badge">📅 ${escapeHtml(dayName)}</div>`;

      grouped[dayName].forEach((row, idx) => {
        const ex = row.exercises;
        const start = ex ? ex.img_start : "";
        const end = ex ? (ex.img_end || ex.img_start) : "";
        const rawExLogs = (logs || []).filter(l => l.workout_exercise_id === row.id);
        const dailyLogs = consolidateTrainerLogsByDay(rawExLogs, unseenIdsSet);
        const latest = dailyLogs[0];

        let feedbackHtml = "";
        if (!latest) {
          feedbackHtml = `
            <div class="athlete-feedback-box empty">
              Nessun dato ancora registrato dall'atleta per questo esercizio.
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

          feedbackHtml = `
            <div class="athlete-feedback-box" style="${outerBorderStyle}">
              <div class="note-athlete-box" style="${latestBoxExtraStyle}">${latestSummary}</div>

              ${latestCoachHtml}

              <div class="coach-reply-form" style="align-items: flex-end;">
                <textarea id="coachReplyInput_${latest.id}" rows="2" placeholder="Aggiungi messaggio del coach..." style="flex: 1; min-height: 44px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;"></textarea>
                <button type="button" class="btn btn-sm" style="background:#ef4444; color:#fff; width:auto; flex-shrink:0; align-self: stretch;" onclick="saveCoachNoteOnLog('${latest.id}', '${clientId}', '${escapeHtml(clientName)}')">Invia</button>
              </div>

              ${olderHtml}
            </div>
          `;
        }

        html += `
          <div class="exercise-item">
            <div class="progress-split">
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
                  ${row.notes && row.notes !== '-' ? `<div class="item-notes" style="white-space: pre-wrap;">Note: ${escapeHtml(row.notes)}</div>` : ''}
                </div>
              </div>
              ${feedbackHtml}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

  html += `</div>`;
  container.innerHTML = html;
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
};
