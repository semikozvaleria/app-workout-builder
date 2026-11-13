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
});

document.getElementById("btnBackToClients").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
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
    return;
  }

  trainerClients = clients;
  document.getElementById("clientsCount").textContent = `${clients.length} atleti`;

  select.innerHTML = `<option value="">-- Nessun atleta collegato (Solo PDF) --</option>` +
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (${c.email})</option>`).join("");

  const { data: workouts } = await supabaseClient
    .from('workouts')
    .select('*')
    .eq('trainer_id', currentProfile.id)
    .eq('status', 'active');

  container.innerHTML = "";
  const today = new Date();

  clients.forEach(client => {
    const activeWorkout = (workouts || []).find(w => w.athlete_id === client.id);
    let badgeHtml = `<span class="status-badge status-none">Nessuna scheda attiva</span>`;

    if (activeWorkout && activeWorkout.end_date) {
      const end = new Date(activeWorkout.end_date);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        badgeHtml = `<span class="status-badge status-expired">Scaduta il ${end.toLocaleDateString('it-IT')}</span>`;
      } else if (diffDays <= 5) {
        badgeHtml = `<span class="status-badge status-expiring">Scade tra ${diffDays} gg (${end.toLocaleDateString('it-IT')})</span>`;
      } else {
        badgeHtml = `<span class="status-badge status-active">Attiva fino al ${end.toLocaleDateString('it-IT')}</span>`;
      }
    }

    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div>
        <strong style="font-size: 0.95rem; display: block;">${escapeHtml(client.full_name)}</strong>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(client.email)}</span><br>
        ${badgeHtml}
      </div>
      <div class="client-actions">
        <button class="btn btn-outline btn-sm" onclick="viewClientWorkouts('${client.id}', '${escapeHtml(client.full_name)}')">📋 Schede</button>
        <button class="btn btn-outline btn-sm" onclick="viewClientProgress('${client.id}', '${escapeHtml(client.full_name)}')">📊 Progressi</button>
        <button class="btn btn-primary btn-sm" onclick="openBuilderForClient('${client.id}', '${escapeHtml(client.full_name)}')">Crea Scheda</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Visualizza scheda attiva + storico completo delle schede assegnate all'atleta
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
      .map(dayName => `
        <div style="margin-top: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 4px;">
            📅 ${escapeHtml(dayName)}
          </div>
          ${grouped[dayName].map((row, idx) => `
            <div style="background: #0d0d0d; border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; font-size: 0.8rem;">
              <strong>${idx + 1}. ${escapeHtml(row.exercises?.name || 'Esercizio')}</strong>
              <span style="color: var(--text-muted);"> — ${escapeHtml(row.sets_reps)} | Rest: ${escapeHtml(row.rest)} | RIR/@: ${escapeHtml(row.rir)}</span>
              ${row.notes && row.notes !== '-' ? `<div style="color: var(--primary); font-size: 0.74rem; margin-top: 2px;">Note: ${escapeHtml(row.notes)}</div>` : ''}
            </div>
          `).join("")}
        </div>
      `).join("");

    const box = document.createElement("div");
    box.style.cssText = `background: #141414; border: 1px solid ${isActive ? 'var(--success)' : 'var(--border)'}; border-radius: 8px; padding: 12px; margin-bottom: 12px;`;

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
        <div>
          <span class="status-badge ${isActive ? 'status-active' : 'status-none'}" style="margin-top: 0; margin-bottom: 4px;">
            ${isActive ? '● SCHEDA ATTIVA' : `ARCHIVIATA #${workouts.length - index}`}
          </span>
          <div style="font-size: 0.82rem; color: var(--text); font-weight: 700;">
            Dal ${startStr} al ${endStr} (${w.duration_weeks} sett.)
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="cloneWorkoutToBuilder('${w.id}', '${clientId}', '${escapeHtml(clientName)}')">
          📥 Carica nel Builder
        </button>
      </div>

      ${w.general_notes ? `<div style="background: #1c1c1e; padding: 6px 8px; border-radius: 6px; font-size: 0.78rem; color: #d1d5db; margin-top: 8px; white-space: pre-wrap;"><strong>Note generali:</strong> ${escapeHtml(w.general_notes)}</div>` : ''}

      <details ${isActive ? 'open' : ''} style="margin-top: 8px;">
        <summary style="cursor: pointer; font-size: 0.8rem; color: var(--primary); font-weight: 600;">
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
    notes: row.notes
  }));

  renderList();
};

// VISTA PROGRESSI: Scheda identica a quella dell'atleta + riquadro affiancato con le modifiche/log registrati
window.viewClientProgress = async function(clientId, clientName) {
  showTrainerView("trainerProgressView");
  document.getElementById("progressAthleteTitle").textContent = `📊 Progressi: ${clientName}`;
  const container = document.getElementById("progressLogsContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento scheda e riscontri atleta...</div>`;

  // 1. Recupera la scheda attiva dell'atleta
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

  // 2. Recupera gli esercizi assegnati e tutti i log salvati dall'atleta
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
    html += `
      <div style="background: #161616; padding: 10px; border-radius: 8px; font-size: 0.82rem; color: #e2e8f0; margin-bottom: 12px; white-space: pre-wrap;">
        <strong>NOTE ASSEGNATE:</strong>\n${escapeHtml(workout.general_notes)}
      </div>
    `;
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
                  const n = old.athlete_notes ? ` — "${escapeHtml(old.athlete_notes)}"` : '';
                  return `<div class="past-log-line"><strong>${d}:</strong> ${old.weight_kg ?? '-'} kg × ${escapeHtml(old.reps_done || '-')}${r}${n}</div>`;
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
              ${latest.athlete_notes ? `<div class="feedback-note">"${escapeHtml(latest.athlete_notes)}"</div>` : ''}
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

window.openBuilderForClient = function(clientId, clientName) {
  showTrainerView("trainerBuilderView");
  document.getElementById("builderAthleteSelect").value = clientId;
  document.getElementById("athleteName").value = clientName;
  document.getElementById("btnLoadExistingWorkout").classList.remove("hidden");
};
