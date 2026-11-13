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

async function loadTrainerClients() {
  const { data: clients, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('trainer_id', currentProfile.id);

  const container = document.getElementById("clientsListContainer");
  const select = document.getElementById("builderAthleteSelect");

  if (error || !clients || clients.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessun atleta ancora collegato. Condividi il tuo Codice Invito!</div>`;
    document.getElementById("clientsCount").textContent = "0 atleti";
    updateNotificationCenter([]);
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
  const coachAlerts = [];
  const enrichedClients = [];

  clients.forEach(client => {
    const activeWorkout = (workouts || []).find(w => w.athlete_id === client.id);
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

    // 1 sola notifica cumulativa per questo atleta finché il coach non apre "Progressi"
    const clientUnreadLogs = (unreadLogs || []).filter(l => l.athlete_id === client.id);
    if (clientUnreadLogs.length > 0) {
      const hasNotes = clientUnreadLogs.some(l => l.athlete_notes);
      coachAlerts.push({
        level: "info",
        title: `🟢 Nuove modifiche da ${escapeHtml(client.full_name)}`,
        message: `L'atleta ha aggiornato la scheda${hasNotes ? ' e inserito nuove note' : ''}.`,
        actionHtml: `<button class="btn btn-primary btn-sm" onclick="document.getElementById('notificationsSection').classList.add('hidden'); viewClientProgress('${client.id}', '${escapeHtml(client.full_name)}')">Apri e Segna Letto</button>`
      });
    }

    enrichedClients.push({ client, badgeHtml, priority, hasUnreadUpdate: clientUnreadLogs.length > 0 });
  });

  enrichedClients.sort((a, b) => a.priority - b.priority);

  enrichedClients.forEach(({ client, badgeHtml, hasUnreadUpdate }) => {
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

// Visualizza scheda attiva + storico completo delle schede assegnate all'atleta (escludendo le bozze)
window.viewClientWorkouts = async function(clientId, clientName) {
  showTrainerView("trainerWorkoutsView");
  document.getElementById("workoutsAthleteTitle").textContent = `📋 Schede: ${clientName}`;
  const container = document.getElementById("athleteWorkoutsHistoryContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento schede...</div>`;

  const { data: workouts, error } = await supabaseClient
    .from('workouts')
    .select('*, workout_exercises(*, exercises(name, muscle, img_start, img_end))')
    .eq('trainer_id', currentProfile.id)
    .eq('athlete_id', clientId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error || !workouts || workouts.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda assegnata a ${escapeHtml(clientName)}.</div>`;
    return;
  }

  container.innerHTML = "";

  workouts.forEach((w, index) => {
    const isActive = w.status === 'active';
    const startStr = w.start_date ? new Date(w.start_date).toLocaleDateString('it-IT') : '-';
    const endStr = w.end_date ? new Date(w.end_date).toLocaleDateString('it-IT') : '-';
    const items = (w.workout_exercises || []).sort((a, b) => a.order_index - b.order_index);

    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.day_name]) grouped[item.day_name] = [];
      grouped[item.day_name].push(item);
    });

    const daysHtml = Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(dayName => {
        let inCircuit = false;
        let circuitBuffer = "";
        let circuitTitle = "CIRCUITO";
        let dayContent = "";

        grouped[dayName].forEach((row, idx) => {
          const roleBadge = row.circuit_role === 'start'
            ? `<span style="font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 INIZIO</span>`
            : row.circuit_role === 'end'
              ? `<span style="font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;">🏁 FINE</span>`
              : row.circuit_role === 'single'
                ? `<span style="font-size:0.68rem; background:var(--primary); color:var(--primary-text); padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;">🔄 CIRCUITO</span>`
                : '';

          const rowHtml = `
            <div style="background: var(--card-bg); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 7px 9px; margin-bottom: 5px; font-size: 0.82rem;">
              <strong>${idx + 1}. ${escapeHtml(row.exercises?.name || 'Esercizio')}</strong>${roleBadge}
              <span style="color: var(--text-muted);"> — ${escapeHtml(row.sets_reps)} | Rest: ${escapeHtml(row.rest)} | RIR/@: ${escapeHtml(row.rir)}</span>
              ${row.notes && row.notes !== '-' ? `<div style="color: var(--primary); font-size: 0.76rem; margin-top: 2px;">Note: ${escapeHtml(row.notes)}</div>` : ''}
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
          dayContent += `<div class="circuit-group-box"><div class="circuit-group-header"><span>🔄 ${escapeHtml(circuitTitle)}</span><span>INIZIO CIRCUITO</span></div>${circuitBuffer}<div class="circuit-group-footer">🏁 Fine Circuito</div></div>`;
        }

        return `
          <div style="margin-top: 8px;">
            <div class="day-badge" style="margin-bottom: 6px;">
              📅 ${escapeHtml(dayName)}
            </div>
            ${dayContent}
          </div>
        `;
      }).join("");

    const box = document.createElement("div");
    box.style.cssText = `background: var(--subcard-bg); color: var(--text); border: 1.5px solid ${isActive ? 'var(--success)' : 'var(--border)'}; border-radius: 8px; padding: 12px; margin-bottom: 12px;`;

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
        <div>
          <span class="status-badge ${isActive ? 'status-active' : 'status-none'}" style="margin-top: 0; margin-bottom: 4px;">
            ${isActive ? '● SCHEDA ATTIVA' : `ARCHIVIATA #${workouts.length - index}`}
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
        <div style="margin-top: 6px;">
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

// VISTA PROGRESSI: Segna automaticamente come letti i log dell'atleta + Note Atleta in Verde + Note Coach in Rosso
window.viewClientProgress = async function(clientId, clientName) {
  showTrainerView("trainerProgressView");
  document.getElementById("progressAthleteTitle").textContent = `📊 Progressi: ${clientName}`;
  const container = document.getElementById("progressLogsContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento scheda e riscontri atleta...</div>`;

  // Marca subito tutti i log non ancora letti di questo atleta come visti dal trainer
  await supabaseClient
    .from('workout_logs')
    .update({ trainer_seen_at: new Date().toISOString() })
    .eq('athlete_id', clientId)
    .is('trainer_seen_at', null);

  // Aggiorna in background i badge e la campanella del coach
  loadTrainerClients();

  const { data: workout } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('trainer_id', currentProfile.id)
    .eq('athlete_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!workout) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda attiva trovata per ${escapeHtml(clientName)}.</div>`;
    return;
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
      .eq('athlete_id', clientId)
      .order('logged_at', { ascending: false })
  ]);

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
        const exLogs = (logs || []).filter(l => l.workout_exercise_id === row.id);
        const latest = exLogs[0];

        let feedbackHtml = "";
        if (!latest) {
          feedbackHtml = `
            <div class="athlete-feedback-box empty">
              Nessun dato ancora registrato dall'atleta per questo esercizio.
            </div>
          `;
        } else {
          const latestDate = new Date(latest.logged_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const rirTxt = (latest.rir !== null && latest.rir !== undefined) ? ` • RIR/@: ${latest.rir}` : '';

          const olderHtml = exLogs.length > 1 ? `
            <details class="past-logs-details">
              <summary>Vedi sessioni precedenti (${exLogs.length - 1})</summary>
              <div style="margin-top: 4px;">
                ${exLogs.slice(1).map(old => {
                  const d = new Date(old.logged_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                  const r = (old.rir !== null && old.rir !== undefined) ? ` • RIR: ${old.rir}` : '';
                  const nAth = old.athlete_notes ? `<div class="note-athlete-box" style="margin-top:3px;">🟢 Atleta: ${escapeHtml(old.athlete_notes)}</div>` : '';
                  const nCoach = old.coach_notes ? `<div class="note-coach-box" style="margin-top:3px;">🔴 Coach: ${escapeHtml(old.coach_notes)}</div>` : '';
                  return `<div class="past-log-line"><strong>${d}:</strong> ${old.weight_kg ?? '-'} kg × ${escapeHtml(old.reps_done || '-')}${r}${nAth}${nCoach}</div>`;
                }).join("")}
              </div>
            </details>
          ` : "";

          feedbackHtml = `
            <div class="athlete-feedback-box">
              <div class="feedback-header">
                <span>✅ RISCONTRO ATLETA</span>
                <span>${latestDate}</span>
              </div>
              <div class="feedback-metrics">
                ${latest.weight_kg ?? '-'} kg × ${escapeHtml(latest.reps_done || '-')}${rirTxt}
              </div>

              ${latest.athlete_notes ? `
                <div class="note-athlete-box">🟢 Nota Atleta: ${escapeHtml(latest.athlete_notes)}</div>
              ` : ''}

              ${latest.coach_notes ? `
                <div class="note-coach-box">🔴 Nota Coach: ${escapeHtml(latest.coach_notes)}</div>
              ` : ''}

              <div class="coach-reply-form">
                <input type="text" id="coachReplyInput_${latest.id}" value="${escapeHtml(latest.coach_notes ?? '')}" placeholder="🔴 Scrivi nota del coach in rosso per l'atleta...">
                <button type="button" class="btn btn-sm" style="background:#ef4444; color:#fff; white-space:nowrap;" onclick="saveCoachNoteOnLog('${latest.id}', '${clientId}', '${escapeHtml(clientName)}')">Salva</button>
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
                  ${row.notes && row.notes !== '-' ? `<div class="item-notes">Note: ${escapeHtml(row.notes)}</div>` : ''}
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

// Salva la nota del Coach (in rosso) e reimposta athlete_seen_at a NULL così l'atleta riceve la notifica
window.saveCoachNoteOnLog = async function(logId, clientId, clientName) {
  const inputEl = document.getElementById(`coachReplyInput_${logId}`);
  if (!inputEl) return;
  const noteText = inputEl.value.trim();

  const { error } = await supabaseClient
    .from('workout_logs')
    .update({
      coach_notes: noteText || null,
      coach_replied_at: noteText ? new Date().toISOString() : null,
      athlete_seen_at: noteText ? null : new Date().toISOString()
    })
    .eq('id', logId);

  if (error) {
    alert("Errore salvataggio nota coach: " + error.message);
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
