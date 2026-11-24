let chartLoadInstance = null;
let chartActiveWorkoutInstance = null;
let chartMuscleInstance = null;
let chartWeightInstance = null;
let currentStatsDataset = null;

document.getElementById("btnBackFromStats").addEventListener("click", () => {
  showTrainerView("trainerClientsView");
});

// Mostra/nasconde il riquadro informativo di una statistica
window.toggleStatInfo = function(infoId) {
  const el = document.getElementById(infoId);
  if (el) el.classList.toggle("hidden");
};

// Estrae serie, ripetizioni per serie e ripetizioni totali dalla prescrizione del coach (es. "4x8-10", "3x12", "8/10'")
function parsePrescribedSetsAndReps(setsRepsStr) {
  if (!setsRepsStr || setsRepsStr === "-") {
    return { sets: 1, repsPerSet: 0, totalReps: 0 };
  }
  const s = String(setsRepsStr).trim();

  // Caso cardio/tempo in minuti (es. "8/10'", "10'", "15 min")
  const timeMatch = s.match(/^(\d+)(?:\s*\/\s*(\d+))?\s*(?:'|min\b)/i);
  if (timeMatch) {
    const mins = parseInt(timeMatch[2] || timeMatch[1], 10);
    return { sets: 1, repsPerSet: mins, totalReps: mins };
  }

  const match = s.match(/^(\d+)\s*[xX×*]\s*(\d+)/);
  if (match) {
    const sets = Math.max(1, parseInt(match[1], 10));
    const repsPerSet = Math.max(0, parseInt(match[2], 10));
    return { sets, repsPerSet, totalReps: sets * repsPerSet };
  }
  const singleNum = s.match(/^(\d+)/);
  if (singleNum) {
    const sets = Math.max(1, parseInt(singleNum[1], 10));
    return { sets, repsPerSet: 0, totalReps: 0 };
  }
  return { sets: 1, repsPerSet: 0, totalReps: 0 };
}

// Estrae eventuali Kg prescritti dal coach dentro sets_reps o notes (es. "4x8 @ 60kg", "50 kg", "62.5kg")
function parsePrescribedWeightKg(setsRepsStr, notesStr) {
  const sources = [setsRepsStr, notesStr];
  for (const src of sources) {
    if (!src || src === "-") continue;
    const match = String(src).match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
    if (match) {
      const val = parseFloat(match[1].replace(",", "."));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return 0;
}

// Calcola ripetizioni totali e media reps per serie da input atleta, con fallback automatico sulla prescrizione del coach
function parseLoggedReps(repsStr, prescribedInfo = { sets: 1, repsPerSet: 0, totalReps: 0 }) {
  const fallbackSets = prescribedInfo.sets || 1;
  const fallbackTotal = prescribedInfo.totalReps || 0;
  const fallbackSingle = prescribedInfo.repsPerSet || 0;

  if (!repsStr || String(repsStr).trim() === "-" || String(repsStr).trim() === "") {
    return {
      totalReps: fallbackTotal,
      setsCount: fallbackSets,
      maxSingleSetReps: fallbackSingle,
      usedPrescribedFallback: true
    };
  }

  const raw = String(repsStr).trim();

  if (raw.includes("S1:")) {
    let total = 0;
    let count = 0;
    let maxRep = 0;
    raw.split("|").forEach(part => {
      const m = part.trim().match(/×\s*(\d+)/);
      if (m) {
        const r = parseInt(m[1], 10);
        if (r > 0) {
          total += r;
          count++;
          if (r > maxRep) maxRep = r;
        }
      }
    });
    if (total > 0) {
      return { totalReps: total, setsCount: count || fallbackSets, maxSingleSetReps: maxRep, usedPrescribedFallback: false };
    }
    return {
      totalReps: fallbackTotal,
      setsCount: fallbackSets,
      maxSingleSetReps: fallbackSingle,
      usedPrescribedFallback: true
    };
  }

  const nums = raw.match(/\d+/g);
  if (!nums || nums.length === 0) {
    return {
      totalReps: fallbackTotal,
      setsCount: fallbackSets,
      maxSingleSetReps: fallbackSingle,
      usedPrescribedFallback: true
    };
  }

  const parsed = nums.map(n => parseInt(n, 10)).filter(n => n > 0);
  if (parsed.length === 0) {
    return {
      totalReps: fallbackTotal,
      setsCount: fallbackSets,
      maxSingleSetReps: fallbackSingle,
      usedPrescribedFallback: true
    };
  }

  if (parsed.length === 1) {
    return {
      totalReps: parsed[0] * fallbackSets,
      setsCount: fallbackSets,
      maxSingleSetReps: parsed[0],
      usedPrescribedFallback: false
    };
  }

  return {
    totalReps: parsed.reduce((acc, v) => acc + v, 0),
    setsCount: parsed.length,
    maxSingleSetReps: Math.max(...parsed),
    usedPrescribedFallback: false
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

function formatShortItDateFromIso(dateStr) {
  if (!dateStr) return "-";
  const clean = String(dateStr).split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}

function formatDayMonthFromIso(dateIso) {
  const parts = String(dateIso).split("-");
  if (parts.length !== 3) return dateIso;
  return `${parts[2]}/${parts[1]}`;
}

window.viewClientStats = async function(clientId, clientName) {
  showTrainerView("trainerStatsView");
  document.getElementById("statsAthleteTitle").textContent = `📈 Statistiche: ${clientName}`;
  const container = document.getElementById("statsDashboardContainer");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Elaborazione grafici e metriche in corso...</div>`;

  const [{ data: workouts }, { data: logs }, { data: checkins }] = await Promise.all([
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
      .order('logged_at', { ascending: true }),
    supabaseClient
      .from('weekly_checkins')
      .select('id, checkin_date, weight_kg, adherence_score, sleep_score, energy_score, stress_score, created_at')
      .eq('athlete_id', clientId)
      .eq('trainer_id', currentProfile.id)
      .order('checkin_date', { ascending: true })
      .order('created_at', { ascending: true })
  ]);

  const weightPoints = (checkins || [])
    .filter(c => c.weight_kg !== null && c.weight_kg !== undefined && !isNaN(parseFloat(c.weight_kg)))
    .map(c => ({
      dateLabel: formatShortItDateFromIso(c.checkin_date),
      rawDate: c.checkin_date,
      weight: +(parseFloat(c.weight_kg).toFixed(1))
    }));

  if ((!workouts || workouts.length === 0) && weightPoints.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Nessuna scheda o check-in registrato per ${escapeHtml(clientName)}.</div>`;
    return;
  }

  const hasWorkouts = workouts && workouts.length > 0;
  const activeWorkout = hasWorkouts ? (workouts.find(w => w.status === 'active') || workouts[0]) : null;
  const allLogs = logs || [];

  const weMap = {};
  const workoutById = {};
  (workouts || []).forEach(w => {
    workoutById[w.id] = w;
    (w.workout_exercises || []).forEach(we => {
      weMap[we.id] = we;
    });
  });

  // 1. CALCOLO COSTANZA E CALENDARIO ATTIVITÀ
  const trainedDatesSet = new Set(
    allLogs.map(l => new Date(l.logged_at).toISOString().split("T")[0])
  );

  const now = new Date();
  let adherencePct = 0;
  let expectedSessions = 0;
  let activeLogsDates = new Set();

  if (activeWorkout) {
    const activeItems = activeWorkout.workout_exercises || [];
    const distinctDaysPerWeek = Math.max(1, new Set(activeItems.map(i => i.day_name)).size);
    const startDate = activeWorkout.start_date ? new Date(activeWorkout.start_date) : new Date(activeWorkout.created_at);
    const elapsedWeeks = Math.max(1, Math.min(activeWorkout.duration_weeks || 4, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24 * 7))));
    expectedSessions = distinctDaysPerWeek * elapsedWeeks;

    activeLogsDates = new Set(
      allLogs
        .filter(l => new Date(l.logged_at) >= startDate)
        .map(l => new Date(l.logged_at).toISOString().split("T")[0])
    );
    adherencePct = Math.min(100, Math.round((activeLogsDates.size / expectedSessions) * 100));
  }

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

  // 2. RICOSTRUZIONE SEDUTE PER DATA (DEDUPLICATA PER GIORNO CALENDARIO)
  const logsByDate = {};
  allLogs.forEach(log => {
    const dateIso = new Date(log.logged_at).toISOString().split("T")[0];
    if (!logsByDate[dateIso]) logsByDate[dateIso] = [];
    logsByDate[dateIso].push(log);
  });

  const effectiveEntries = [];
  Object.keys(logsByDate).sort().forEach(dateIso => {
    const dayLogs = logsByDate[dateIso];
    const loggedByWeId = {};
    dayLogs.forEach(l => {
      loggedByWeId[l.workout_exercise_id] = l;
    });

    const sessionDayKeys = new Map();
    dayLogs.forEach(l => {
      const we = weMap[l.workout_exercise_id];
      if (we && we.workout_id && we.day_name) {
        sessionDayKeys.set(`${we.workout_id}::${we.day_name}`, {
          workoutId: we.workout_id,
          dayName: we.day_name,
          loggedAt: l.logged_at
        });
      }
    });

    const coveredWeIds = new Set();

    sessionDayKeys.forEach(({ workoutId, dayName, loggedAt }) => {
      const w = workoutById[workoutId];
      if (!w || !Array.isArray(w.workout_exercises)) return;

      const dayExercises = w.workout_exercises
        .filter(we => we.day_name === dayName)
        .sort((a, b) => a.order_index - b.order_index);

      dayExercises.forEach(we => {
        coveredWeIds.add(we.id);
        const existingLog = loggedByWeId[we.id];
        effectiveEntries.push({
          dateIso,
          workout_exercise_id: we.id,
          logged_at: existingLog ? existingLog.logged_at : loggedAt,
          weight_kg: existingLog ? existingLog.weight_kg : null,
          reps_done: existingLog ? existingLog.reps_done : null,
          rir: existingLog ? existingLog.rir : null
        });
      });
    });

    dayLogs.forEach(l => {
      if (!coveredWeIds.has(l.workout_exercise_id)) {
        effectiveEntries.push({
          ...l,
          dateIso
        });
      }
    });
  });

  // 3. VOLUME DI LAVORO & STORICO ESERCIZI
  let totalTonnageKg = 0;
  const muscleSetsMap = {};
  const exerciseHistoryMap = {};
  const lastKnownWeightByExId = {};

  let targetRirSum = 0;
  let targetRirCount = 0;
  let loggedRirSum = 0;
  let loggedRirCount = 0;

  effectiveEntries.forEach(log => {
    const we = weMap[log.workout_exercise_id];
    const exInfo = we?.exercises;
    const exKey = we?.exercise_id || exInfo?.id || log.workout_exercise_id;
    const prescribedInfo = parsePrescribedSetsAndReps(we?.sets_reps);
    const { totalReps, setsCount, maxSingleSetReps } = parseLoggedReps(log.reps_done, prescribedInfo);

    const rawWeight = (log.weight_kg !== null && log.weight_kg !== undefined && String(log.weight_kg).trim() !== "")
      ? parseFloat(String(log.weight_kg).replace(",", "."))
      : NaN;
    const prescribedWeight = parsePrescribedWeightKg(we?.sets_reps, we?.notes);

    let weight = 0;
    if (!isNaN(rawWeight) && rawWeight > 0) {
      weight = rawWeight;
      lastKnownWeightByExId[exKey] = rawWeight;
    } else if (prescribedWeight > 0) {
      weight = prescribedWeight;
      lastKnownWeightByExId[exKey] = prescribedWeight;
    } else if (lastKnownWeightByExId[exKey]) {
      weight = lastKnownWeightByExId[exKey];
    }

    if (weight > 0 && totalReps > 0) {
      totalTonnageKg += weight * totalReps;
    }

    const muscle = exInfo?.muscle || "Altro";
    const effectiveSets = setsCount > 0 ? setsCount : prescribedInfo.sets;
    muscleSetsMap[muscle] = (muscleSetsMap[muscle] || 0) + effectiveSets;

    const tRir = parseTargetRir(we?.rir);
    const hasLoggedRir = log.rir !== null && log.rir !== undefined && String(log.rir).trim() !== "";
    if (tRir !== null) {
      targetRirSum += tRir;
      targetRirCount++;
      loggedRirSum += hasLoggedRir ? parseFloat(String(log.rir).replace(",", ".")) : tRir;
      loggedRirCount++;
    } else if (hasLoggedRir) {
      loggedRirSum += parseFloat(String(log.rir).replace(",", "."));
      loggedRirCount++;
    }

    const dateLabel = formatDayMonthFromIso(log.dateIso);

    if (exInfo && (weight > 0 || maxSingleSetReps > 0)) {
      if (!exerciseHistoryMap[exInfo.id]) {
        exerciseHistoryMap[exInfo.id] = { name: exInfo.name, points: [] };
      }
      exerciseHistoryMap[exInfo.id].points.push({
        date: dateLabel,
        weight,
        est1rm: estimate1RM(weight, maxSingleSetReps || 1)
      });
    }
  });

  // 3B. COSTRUZIONE SERIE SCHEDA IN CORSO: 1 PUNTO PER OGNI GIORNATA DI ALLENAMENTO (ES. 3 SEDUTE = 3 PUNTI PER OGNI ESERCIZIO)
  const activeWorkoutExerciseMap = {};
  if (activeWorkout) {
    const activeWeList = (activeWorkout.workout_exercises || [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index);

    const activeWeIds = new Set(activeWeList.map(we => we.id));
    const activeLogs = allLogs.filter(l => activeWeIds.has(l.workout_exercise_id));

    // Date uniche ordinate in cui l'atleta si è allenato sulla scheda attiva (es. ["2026-11-20", "2026-11-21", "2026-11-23"])
    const sessionDatesSorted = Array.from(
      new Set(activeLogs.map(l => new Date(l.logged_at).toISOString().split("T")[0]))
    ).sort();

    // Raggruppa gli esercizi della scheda attiva per exercise_id (evitando duplicati se un esercizio compare in più giorni)
    const uniqueExercisesInActive = {};
    activeWeList.forEach(we => {
      const exKey = we.exercise_id || (we.exercises ? we.exercises.id : we.id);
      if (!uniqueExercisesInActive[exKey]) {
        uniqueExercisesInActive[exKey] = {
          exKey,
          name: we.exercises ? we.exercises.name : 'Esercizio',
          setsReps: we.sets_reps,
          notes: we.notes,
          weIds: new Set([we.id])
        };
      } else {
        uniqueExercisesInActive[exKey].weIds.add(we.id);
      }
    });

    if (sessionDatesSorted.length > 0) {
      Object.values(uniqueExercisesInActive).forEach(exMeta => {
        const prescribedInfo = parsePrescribedSetsAndReps(exMeta.setsReps);
        const prescribedWeight = parsePrescribedWeightKg(exMeta.setsReps, exMeta.notes);
        let rollingWeight = prescribedWeight || lastKnownWeightByExId[exMeta.exKey] || 0;

        const points = sessionDatesSorted.map(dateIso => {
          // Cerca se in questa data l'atleta ha loggato questo esercizio (prende l'ultimo log della giornata)
          const matchingLogs = activeLogs.filter(l => {
            const lDate = new Date(l.logged_at).toISOString().split("T")[0];
            return lDate === dateIso && exMeta.weIds.has(l.workout_exercise_id);
          });
          const latestLog = matchingLogs.length > 0 ? matchingLogs[matchingLogs.length - 1] : null;

          const { totalReps, maxSingleSetReps } = parseLoggedReps(
            latestLog ? latestLog.reps_done : null,
            prescribedInfo
          );

          const rawWeight = (latestLog && latestLog.weight_kg !== null && latestLog.weight_kg !== undefined && String(latestLog.weight_kg).trim() !== "")
            ? parseFloat(String(latestLog.weight_kg).replace(",", "."))
            : NaN;

          let weight = rollingWeight;
          if (!isNaN(rawWeight) && rawWeight > 0) {
            weight = rawWeight;
            rollingWeight = rawWeight;
          }

          return {
            date: formatDayMonthFromIso(dateIso),
            weight,
            totalReps,
            maxSetReps: maxSingleSetReps
          };
        });

        activeWorkoutExerciseMap[exMeta.exKey] = {
          name: exMeta.name,
          setsReps: exMeta.setsReps,
          points
        };
      });
    }
  }

  const activeExWithDataIds = Object.keys(activeWorkoutExerciseMap).filter(
    exKey => activeWorkoutExerciseMap[exKey].points.length > 0
  );

  const avgTargetRir = targetRirCount > 0 ? (targetRirSum / targetRirCount).toFixed(1) : "-";
  const avgLoggedRir = loggedRirCount > 0 ? (loggedRirSum / loggedRirCount).toFixed(1) : "-";

  let rirInsight = "Dati RIR non ancora sufficienti per il confronto.";
  if (targetRirCount > 0 && loggedRirCount > 0) {
    const diff = +(avgLoggedRir - avgTargetRir).toFixed(1);
    if (Math.abs(diff) <= 0.5) {
      rirInsight = "✅ Ottimo allineamento: l'atleta rispetta l'intensità target prescritta.";
    } else if (diff < -0.5) {
      rirInsight = "🔥 Intensità più alta del previsto (meno buffer del target): monitora la fatica.";
    } else {
      rirInsight = "Buffer più ampio del target: margini per aumentare leggermente i carichi.";
    }
  }

  // 4. METRICHE PESO CORPOREO (STORICO COMPLETO CHECK-IN)
  let weightBannerHtml = "";
  if (weightPoints.length > 0) {
    const firstW = weightPoints[0].weight;
    const latestW = weightPoints[weightPoints.length - 1].weight;
    const deltaW = +(latestW - firstW).toFixed(1);
    const deltaSign = deltaW > 0 ? "+" : "";
    const minW = Math.min(...weightPoints.map(p => p.weight));
    const maxW = Math.max(...weightPoints.map(p => p.weight));
    const deltaColor = deltaW === 0 ? "var(--text-muted)" : "var(--primary)";

    weightBannerHtml = `
      <div style="display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.78rem; margin-bottom: 8px; padding: 8px 10px; border-radius: 6px; background: var(--subcard-bg); border: 1px solid var(--border);">
        <span>Attuale: <strong style="color: var(--primary);">${latestW} kg</strong></span>
        <span>• Iniziale: <strong>${firstW} kg</strong></span>
        <span>• Variazione: <strong style="color: ${deltaColor};">${deltaSign}${deltaW} kg</strong></span>
        <span>• Range: <strong>${minW}–${maxW} kg</strong> (${weightPoints.length} pesate)</span>
      </div>
    `;
  }

  const exerciseIds = Object.keys(exerciseHistoryMap);
  currentStatsDataset = { exerciseHistoryMap, muscleSetsMap, weightPoints, activeWorkoutExerciseMap };

  container.innerHTML = `
    <!-- KPI PRINCIPALI -->
    <div class="stats-kpi-grid">
      <div class="kpi-box">
        <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoKpiAdherence')" title="Info">i</button>
        <span class="kpi-value">${hasWorkouts ? adherencePct + '%' : '-'}</span>
        <span class="kpi-label">Costanza Scheda</span>
      </div>
      <div class="kpi-box">
        <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoKpiSessions')" title="Info">i</button>
        <span class="kpi-value">${trainedDatesSet.size}</span>
        <span class="kpi-label">Sedute Svolte</span>
      </div>
      <div class="kpi-box">
        <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoKpiTonnage')" title="Info">i</button>
        <span class="kpi-value">${Math.round(totalTonnageKg).toLocaleString('it-IT')} kg</span>
        <span class="kpi-label">Tonnellaggio Tot.</span>
      </div>
      <div class="kpi-box">
        <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoKpiRir')" title="Info">i</button>
        <span class="kpi-value">${avgLoggedRir} / ${avgTargetRir}</span>
        <span class="kpi-label">RIR Reale vs Target</span>
      </div>
    </div>

    <!-- RIQUADRI INFO KPI (A COMPASSA) -->
    <div id="infoKpiAdherence" class="stat-info-box hidden">
      <strong>Costanza Scheda (%):</strong> misura l'aderenza dell'atleta al programma attuale. Viene calcolata dividendo i giorni in cui ha registrato almeno un esercizio per le sedute attese finora (<em>giorni settimanali della scheda × settimane trascorse</em>).
    </div>
    <div id="infoKpiSessions" class="stat-info-box hidden">
      <strong>Sedute Svolte:</strong> conta il numero totale di giornate distinte in cui l'atleta ha salvato almeno una registrazione nel diario carichi dall'inizio del percorso.
    </div>
    <div id="infoKpiTonnage" class="stat-info-box hidden">
      <strong>Tonnellaggio Totale (kg):</strong> indica il carico meccanico complessivo sollevato. Si calcola sommando <em>Peso (kg) × Ripetizioni totali</em> di ogni esercizio della seduta svolta (usando automaticamente serie, ripetizioni e carico prescritti dal coach se l'atleta non segnala variazioni).
    </div>
    <div id="infoKpiRir" class="stat-info-box hidden">
      <strong>RIR Reale vs Target:</strong> confronta il buffer medio percepito dall'atleta (<em>RIR Reale</em>) con quello assegnato nella scheda (<em>Target</em>). Se non vengono inserite variazioni, il target prescritto viene considerato rispettato.
    </div>

    <!-- 0. ANDAMENTO PESO CORPOREO -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>
          ⚖️ Andamento Peso Corporeo
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlockWeight')" title="Info">i</button>
        </span>
      </div>
      <div id="infoBlockWeight" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> traccia l'evoluzione del peso corporeo nel lungo periodo attraverso tutte le pesate inviate nei check-in settimanali.
      </div>
      ${weightPoints.length > 0 ? `
        ${weightBannerHtml}
        <div class="chart-canvas-wrap"><canvas id="canvasWeightProgression"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessun peso ancora registrato nei check-in settimanali.</div>`}
    </div>

    <!-- 0B. ANDAMENTO SCHEDA IN CORSO (KG E/O RIPETIZIONI PER ESERCIZIO) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>
          🎯 Scheda in Corso: Kg & Ripetizioni
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlockActiveEx')" title="Info">i</button>
        </span>
      </div>
      <div id="infoBlockActiveEx" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> mostra la progressione seduta dopo seduta su ciascun esercizio della <em>scheda attualmente attiva</em>, considerando automaticamente serie, ripetizioni e carico prescritti dal coach nelle sedute in cui l'atleta non segnala variazioni.
      </div>
      ${activeExWithDataIds.length > 0 ? `
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
          <select id="statsActiveExerciseSelect" style="flex: 1; min-width: 170px; padding: 6px 8px; font-size: 0.78rem;">
            ${activeExWithDataIds.map(exKey => `<option value="${exKey}">${escapeHtml(activeWorkoutExerciseMap[exKey].name)}</option>`).join("")}
          </select>
          <select id="statsActiveMetricMode" style="width: auto; padding: 6px 8px; font-size: 0.78rem;">
            <option value="both">Kg + Ripetizioni</option>
            <option value="kg">Solo Kg</option>
            <option value="reps">Solo Ripetizioni</option>
          </select>
        </div>
        <div id="statsActiveExSummary" style="font-size: 0.76rem; color: var(--primary); font-weight: 600; margin-bottom: 6px;"></div>
        <div class="chart-canvas-wrap"><canvas id="canvasActiveWorkoutExercise"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessuna seduta ancora registrata sulla scheda attiva corrente.</div>`}
    </div>

    <!-- 1. PROGRESSIONE CARICHI & STIMA 1RM (STORICO GENERALE) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>
          🏋️ Progressione Carichi & Stima 1RM
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlock1RM')" title="Info">i</button>
        </span>
        ${exerciseIds.length > 0 ? `
          <select id="statsExerciseSelect" style="width: auto; max-width: 220px; padding: 5px 8px; font-size: 0.78rem;">
            ${exerciseIds.map(id => `<option value="${id}">${escapeHtml(exerciseHistoryMap[id].name)}</option>`).join("")}
          </select>
        ` : ''}
      </div>
      <div id="infoBlock1RM" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> monitora l'aumento della forza nel tempo su ciascun esercizio attraverso tutte le schede.<br>
        <strong>Come si calcola:</strong> la linea azzurra mostra il carico effettivo usato; la linea verde tratteggiata stima il massimale su 1 ripetizione tramite la <em>formula di Epley</em>: <code>Peso × (1 + Reps / 30)</code>.
      </div>
      ${exerciseIds.length > 0 ? `
        <div id="statsBest1RmBanner" style="font-size: 0.78rem; color: var(--success); font-weight: 700; margin-bottom: 6px;"></div>
        <div class="chart-canvas-wrap"><canvas id="canvasLoadProgression"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessun carico ancora registrato per generare il grafico.</div>`}
    </div>

    <!-- 2. VOLUME DI LAVORO (SERIE PER MUSCOLO) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>
          📊 Ripartizione Serie per Gruppo Muscolare
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlockMuscle')" title="Info">i</button>
        </span>
      </div>
      <div id="infoBlockMuscle" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> verifica l'equilibrio del volume allenante tra i vari distretti muscolari.
      </div>
      ${Object.keys(muscleSetsMap).length > 0 ? `
        <div class="chart-canvas-wrap"><canvas id="canvasMuscleVolume"></canvas></div>
      ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">Nessun volume registrato al momento.</div>`}
    </div>

    <!-- 3. RECUPERO & INTENSITÀ (RIR) -->
    <div class="stats-card-block">
      <div class="stats-block-title">
        <span>
          🔋 Recupero & Gestione Intensità (RIR)
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlockRir')" title="Info">i</button>
        </span>
      </div>
      <div id="infoBlockRir" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> valuta la qualità del recupero e l'accuratezza dell'autoregolazione dell'atleta.
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
        <span>
          📅 Calendario Attività (Ultimi 28 giorni)
          <button type="button" class="btn-stat-info" onclick="toggleStatInfo('infoBlockCal')" title="Info">i</button>
        </span>
        <span style="font-size: 0.74rem; color: var(--success);">${activeLogsDates.size} / ${expectedSessions} sedute scheda</span>
      </div>
      <div id="infoBlockCal" class="stat-info-box hidden">
        <strong>A cosa serve:</strong> offre un colpo d'occhio sulla regolarità settimanale nell'ultimo mese.
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

  if (weightPoints.length > 0) {
    renderWeightProgressionChart(weightPoints);
  }

  if (activeExWithDataIds.length > 0) {
    const selActive = document.getElementById("statsActiveExerciseSelect");
    const modeActive = document.getElementById("statsActiveMetricMode");
    const updateActiveChart = () => renderActiveWorkoutExerciseChart(selActive.value, modeActive.value);
    updateActiveChart();
    selActive.addEventListener("change", updateActiveChart);
    modeActive.addEventListener("change", updateActiveChart);
  }

  if (exerciseIds.length > 0) {
    const sel = document.getElementById("statsExerciseSelect");
    renderLoadProgressionChart(sel.value);
    sel.addEventListener("change", (e) => renderLoadProgressionChart(e.target.value));
  }

  if (Object.keys(muscleSetsMap).length > 0) {
    renderMuscleVolumeChart(muscleSetsMap);
  }
};

function renderActiveWorkoutExerciseChart(exKey, mode = "both") {
  if (!currentStatsDataset || !currentStatsDataset.activeWorkoutExerciseMap) return;
  const entry = currentStatsDataset.activeWorkoutExerciseMap[exKey];
  if (!entry) return;

  const summaryEl = document.getElementById("statsActiveExSummary");
  if (summaryEl) {
    summaryEl.textContent = `Target prescritto: ${entry.setsReps} • ${entry.points.length} sedute registrate`;
  }

  const canvas = document.getElementById("canvasActiveWorkoutExercise");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (chartActiveWorkoutInstance) chartActiveWorkoutInstance.destroy();

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8e8e93';
  const datasets = [];

  if (mode === "both" || mode === "kg") {
    datasets.push({
      label: 'Carico Max (kg)',
      data: entry.points.map(p => p.weight),
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.16)',
      yAxisID: 'yKg',
      tension: 0.25,
      fill: mode === "kg"
    });
  }

  if (mode === "both" || mode === "reps") {
    datasets.push({
      label: 'Ripetizioni Totali Seduta',
      data: entry.points.map(p => p.totalReps),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.16)',
      yAxisID: mode === "both" ? 'yReps' : 'yKg',
      tension: 0.25,
      fill: mode === "reps"
    });
  }

  const scales = {
    x: { ticks: { color: textColor, font: { size: 10 } } },
    yKg: {
      type: 'linear',
      position: 'left',
      beginAtZero: false,
      ticks: { color: textColor, font: { size: 10 } }
    }
  };

  if (mode === "both") {
    scales.yReps = {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: { color: '#f59e0b', font: { size: 10 }, stepSize: 1 }
    };
  }

  chartActiveWorkoutInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: entry.points.map(p => p.date),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      scales
    }
  });
}

function renderWeightProgressionChart(weightPoints) {
  const canvas = document.getElementById("canvasWeightProgression");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (chartWeightInstance) chartWeightInstance.destroy();

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#8e8e93';

  chartWeightInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weightPoints.map(p => p.dateLabel),
      datasets: [
        {
          label: 'Peso Corporeo (kg)',
          data: weightPoints.map(p => p.weight),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.16)',
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          tension: 0.25,
          fill: true
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
