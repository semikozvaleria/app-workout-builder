let chartLoadInstance = null;
let chartMuscleInstance = null;
let currentStatsDataset = null;

document.getElementById("btnBackFromStats").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
});

// Estrae numero di serie da stringhe tipo "4x8-10" o "3x12"
function parsePrescribedSets(setsRepsStr) {
  if (!setsRepsStr) return 1;
  const match = String(setsRepsStr).trim().match(/^(\d+)\s*[xX×*]/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

// Calcola ripetizioni totali e media reps per serie da input atleta (es. "10-9-8" -> total 27, sets 3)
function parseLoggedReps(repsStr, fallbackSets = 1) {
  if (!repsStr || repsStr === "-") return { totalReps: 0, setsCount: 0, maxSingleSetReps: 0 };
  const nums = String(repsStr).match(/\d+/g);
  if (!nums || nums.length === 0) return { totalReps: 0, setsCount: 0, maxSingleSetReps: 0 };

  const parsed = nums.map(n => parseInt(n, 10)).filter(n => n > 0);
  if (parsed.length === 0) return { totalReps: 0, setsCount: 0, maxSingleSetReps: 0 };

  if (parsed.length === 1) {
    // Se l'atleta ha scritto un solo numero (es. "10"), lo moltiplichiamo per le serie prescritte
    return {
      totalReps: parsed[0] * fallbackSets,
      setsCount: fallbackSets,
      maxSingleSetReps: parsed[0]
    };
  }

  return {
    totalReps: parsed.reduce((acc, v) => acc + v, 0),
    setsCount: parsed.length,
    maxSingleSetReps: Math.max(...parsed)
  };
}

// Estrae valore numerico del RIR target (es. "RIR 2" -> 2, "@8" -> 2)
function parseTargetRir(rirStr) {
  if (!rirStr || rirStr === "-") return null;
  const s = String(rirStr).trim();
  const rpeMatch = s.match(/@\s*(\d+(?:[.,]\d+)?)/);
  if (rpeMatch) {
    const rpe = parseFloat(rpeMatch[1].replace(",", "."));
    return Math.max(0, +(10 - rpe).toFixed(1));
  }
  const numMatch = s.match(/(\d+(?:[.,]\d+)?)/);
  return numMatch ? parseFloat(numMatch[1].replace(",", ".")) : null;
}

// Formula Epley per stima 1RM
function estimate1RM(weightKg, reps) {
  if (!weightKg || weightKg <= 0) return 0;
  if (!reps || reps <= 1) return +weightKg.toFixed(1);
  return +(weightKg * (1 + reps / 30)).toFixed(1);
}

window.viewClientStats = async function(clientId, clientName) {
  showTrainerView("trainerStatsView");
  document.getElementById("statsAthleteTitle").textContent = `📈 Statistiche: ${clientName}`;
  const container = document.getElementById("statsDashboardContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Elaborazione grafici e metriche in corso...</div>`;

  const [{ data: workouts }, { data: logs }] = await Promise.all([
    supabaseClient
      .from('workouts')
      .select('*, workout_exercises(*, exercises(id, name, muscle))')
      .eq('trainer_id', currentProfile.id)
      .eq('athlete_id', clientId)
      .order('created_at', { ascending: false }),
    supabaseClient
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', clientId)
      .order('logged_at', { ascending: true })
  ]);

  if (!workouts || workouts.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda assegnata a ${escapeHtml(clientName)}.</div>`;
    return;
  }

  const activeWorkout = workouts.find(w => w.status === 'active') || workouts[0];
  const allLogs = logs || [];

  // Mappa tutti i workout_exercises di tutte le schede dell'atleta
  const weMap = {};
  workouts.forEach(w => {
    (w.workout_exercises || []).forEach(we => {
      weMap[we.id] = we;
    });
  });

  // 1. CALCOLO COSTANZA E CALENDARIO ATTIVITÀ
  const trainedDatesSet = new Set(
    allLogs.map(l => new Date(l.logged_at).toISOString().split("T")[0])
  );

  const activeItems = activeWorkout.workout_exercises || [];
  const distinctDaysPerWeek = Math.max(1, new Set(activeItems.map(i => i.day_name)).size);
  const startDate = activeWorkout.start_date ? new Date(activeWorkout.start_date) : new Date(activeWorkout.created_at);
  const now = new Date();
  const elapsedWeeks = Math.max(1, Math.min(activeWorkout.duration_weeks || 4, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24 * 7))));
  const expectedSessions = distinctDaysPerWeek * elapsedWeeks;

  const activeLogsDates = new Set(
    allLogs
      .filter(l => new Date(l.logged_at) >= startDate)
      .map(l => new Date(l.logged_at).toISOString().split("T")[0])
  );
  const adherencePct = Math.min(100, Math.round((activeLogsDates.size / expectedSessions) * 100));

  // Ultimi 28 giorni per il calendario attività
  const last28Days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    last28Days.push({
      iso,
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString('it-IT', { month: 'short' }),
      trained: trainedDatesSet.has(iso)
    });
  }

  // 2. VOLUME DI LAVORO (Tonnellaggio & Serie per Muscolo)
  let totalTonnageKg = 0;
  const muscleSetsMap = {};
  const exerciseHistoryMap = {}; // exercise_id -> { name, points: [] }

  // 3. RECUPERO (RIR Prescritto vs RIR Percepito)
  let targetRirSum = 0;
  let targetRirCount = 0;
  let loggedRirSum = 0;
  let loggedRirCount = 0;

  allLogs.forEach(log => {
    const we = weMap[log.workout_exercise_id];
    const exInfo = we?.exercises;
    const prescribedSets = parsePrescribedSets(we?.sets_reps);
    const { totalReps, setsCount, maxSingleSetReps } = parseLoggedReps(log.reps_done, prescribedSets);
    const weight = parseFloat(log.weight_kg) || 0;

    if (weight > 0 && totalReps > 0) {
      totalTonnageKg += weight * totalReps;
    }

    const muscle = exInfo?.muscle || "Altro";
    const effectiveSets = setsCount > 0 ? setsCount : prescribedSets;
    muscleSetsMap[muscle] = (muscleSetsMap[muscle] || 0) + effectiveSets;

    // RIR confronto
    const tRir = parseTargetRir(we?.rir);
    if (tRir !== null && log.rir !== null && log.rir !== undefined) {
      targetRirSum += tRir;
      targetRirCount++;
      loggedRirSum += parseFloat(log.rir);
      loggedRirCount++;
    }

    // Serie storica per esercizio (1RM & Carico)
    if (exInfo && (weight > 0 || maxSingleSetReps > 0)) {
      if (!exerciseHistoryMap[exInfo.id]) {
        exerciseHistoryMap[exInfo.id] = { name: exInfo.name, points: [] };
      }
      exerciseHistoryMap[exInfo.id].points.push({
        date: new Date(log.logged_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        weight,
        est1rm: estimate1RM(weight, maxSingleSetReps || 1)
      });
    }
  });

  const avgTargetRir = targetRirCount > 0 ? (targetRirSum / targetRirCount).toFixed(1) : "-";
  const avgLoggedRir = loggedRirCount > 0 ? (loggedRirSum / loggedRirCount).toFixed(1) : "-";

  let rirInsight = "Dati RIR non ancora sufficienti per il confronto.";
  if (targetRirCount > 0) {
    const diff = +(avgLoggedRir - avgTargetRir).toFixed(1);
    if (Math.abs(diff) <= 0.5) {
      rirInsight = "✅ Ottimo allineamento: l'atleta rispetta l'intensità target prescritta.";
    } else if (diff < -0.5) {
      rirInsight = "🔥 Intensità più alta del previsto (meno buffer del target): monitora la fatica.";
    } else {
      rirInsight = "💡 Buffer più ampio del target: margini per aumentare leggermente i carichi.";
    }
  }

  const exerciseIds = Object.keys(exerciseHistoryMap);
  currentStatsDataset = { exerciseHistoryMap, muscleSetsMap };

  container.innerHTML = `
    <!-- KPI PRINCIPALI -->
    <div class="stats-kpi-grid">
      <div class="kpi-box">
        <span class="kpi-value">${adherencePct}%</span>
        <span class="kpi-label">Costanza Scheda</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-value">${trainedDatesSet.size}</span>
        <span class="kpi-label">Sedute Svolte</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-value">${Math.round(totalTonnageKg).toLocaleString('it-IT')} kg</span>
        <span class="kpi-label">Tonnellaggio Tot.</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-value">${avgLoggedRir} / ${avgTargetRir}</span>
        <span class="kpi-label">RIR Reale vs Target</span>
      </div>
    </div>

    <!-- 1. PROGRESSIONE CARICHI & STIMA 1RM -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>🏋️ Progressione Carichi & Stima 1RM</span>
        ${exerciseIds.length > 0 ? `
          <select id="statsExerciseSelect" style="width: auto; max-width: 220px; padding: 5px 8px; font-size: 0.78rem;">
            ${exerciseIds.map(id => `<option value="${id}">${escapeHtml(exerciseHistoryMap[id].name)}</option>`).join("")}
          </select>
        ` : ''}
      </div>
      ${exerciseIds.length > 0 ? `
        <div id="statsBest1RmBanner" style="font-size: 0.78rem; color: var(--success); font-weight: 700; margin-bottom: 6px;"></div>
        <div class="chart-canvas-wrap"><canvas id="canvasLoadProgression"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessun carico ancora registrato per generare il grafico.</div>`}
    </div>

    <!-- 2. VOLUME DI LAVORO (SERIE PER MUSCOLO) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>📊 Ripartizione Serie per Gruppo Muscolare</span>
      </div>
      ${Object.keys(muscleSetsMap).length > 0 ? `
        <div class="chart-canvas-wrap"><canvas id="canvasMuscleVolume"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessun volume registrato al momento.</div>`}
    </div>

    <!-- 3. RECUPERO & INTENSITÀ (RIR) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>🔋 Recupero & Gestione Intensità (RIR)</span>
      </div>
      <div class="rir-compare-bar">
        <div class="rir-pill-box">
          <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">RIR MEDIO PRESCRITTO</span>
          <strong style="font-size: 1.05rem; color: var(--primary);">${avgTargetRir}</strong>
        </div>
        <div class="rir-pill-box">
          <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">RIR MEDIO PERCEPITO</span>
          <strong style="font-size: 1.05rem; color: var(--success);">${avgLoggedRir}</strong>
        </div>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 8px;">${rirInsight}</div>
    </div>

    <!-- 4. CALENDARIO ATTIVITÀ (ULTIMI 28 GIORNI) -->
    <div class="stats-card-block" style="margin-bottom: 0;">
      <div class="stats-block-title">
        <span>📅 Calendario Attività (Ultimi 28 giorni)</span>
        <span style="font-size: 0.74rem; color: var(--success);">${activeLogsDates.size} / ${expectedSessions} sedute scheda</span>
      </div>
      <div class="activity-cal-grid">
        ${last28Days.map(d => `
          <div class="cal-day-cell ${d.trained ? 'trained' : ''}" title="${d.iso}">
            <div>${d.dayNum}</div>
            <div style="font-size: 0.62rem;">${d.trained ? '✅' : d.monthShort}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  if (exerciseIds.length > 0) {
    const sel = document.getElementById("statsExerciseSelect");
    renderLoadProgressionChart(sel.value);
    sel.addEventListener("change", (e) => renderLoadProgressionChart(e.target.value));
  }

  if (Object.keys(muscleSetsMap).length > 0) {
    renderMuscleVolumeChart(muscleSetsMap);
  }
};

function renderLoadProgressionChart(exerciseId) {
  if (!currentStatsDataset) return;
  const entry = currentStatsDataset.exerciseHistoryMap[exerciseId];
  if (!entry) return;

  const max1rm = Math.max(...entry.points.map(p => p.est1rm));
  const maxWeight = Math.max(...entry.points.map(p => p.weight));
  document.getElementById("statsBest1RmBanner").textContent = `Picco Carico: ${maxWeight} kg • Stima 1RM Massimo: ${max1rm} kg`;

  const ctx = document.getElementById("canvasLoadProgression").getContext("2d");
  if (chartLoadInstance) chartLoadInstance.destroy();

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8e8e93';

  chartLoadInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: entry.points.map(p => p.date),
      datasets: [
        {
          label: 'Carico Usato (kg)',
          data: entry.points.map(p => p.weight),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          tension: 0.25,
          fill: true
        },
        {
          label: 'Stima 1RM (kg)',
          data: entry.points.map(p => p.est1rm),
          borderColor: '#22c55e',
          borderDash: [5, 5],
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } } },
        y: { ticks: { color: textColor, font: { size: 10 } } }
      }
    }
  });
}

function renderMuscleVolumeChart(muscleSetsMap) {
  const ctx = document.getElementById("canvasMuscleVolume").getContext("2d");
  if (chartMuscleInstance) chartMuscleInstance.destroy();

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8e8e93';
  const labels = Object.keys(muscleSetsMap);
  const values = Object.values(muscleSetsMap);

  chartMuscleInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Serie Allenanti Totali',
        data: values,
        backgroundColor: ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#6366f1'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { color: textColor, font: { size: 10 }, stepSize: 1 } }
      }
    }
  });
}
