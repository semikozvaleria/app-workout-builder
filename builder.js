async function savePdfSnapshotToHistory({ athleteId, athleteName, durationWeeks, generalNotes, items }) {
  if (!currentProfile || currentProfile.role !== "trainer") return;

  if (athleteId) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (parseInt(durationWeeks, 10) || 4) * 7);

    const { data: archivedWorkout, error } = await supabaseClient
      .from('workouts')
      .insert({
        trainer_id: currentProfile.id,
        athlete_id: athleteId,
        title: `PDF ${durationWeeks} Settimane`,
        general_notes: generalNotes,
        duration_weeks: parseInt(durationWeeks, 10) || 4,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'archived'
      })
      .select()
      .single();

    if (!error && archivedWorkout && items.length > 0) {
      const rows = items.map((ex, idx) => ({
        workout_id: archivedWorkout.id,
        exercise_id: ex.id,
        day_name: ex.day,
        sets_reps: ex.setsReps,
        rest: ex.rest,
        rir: ex.rir,
        notes: ex.notes,
        order_index: idx,
        circuit_role: ex.circuitRole || null,
        circuit_label: ex.circuitLabel || null
      }));
      await supabaseClient.from('workout_exercises').insert(rows);
    }
  } else {
    const { data: savedExt } = await supabaseClient
      .from('external_athlete_workouts')
      .insert({
        trainer_id: currentProfile.id,
        athlete_name: athleteName,
        duration_weeks: parseInt(durationWeeks, 10) || 4,
        general_notes: generalNotes || null,
        exercises_json: items.map(ex => ({
          id: ex.id,
          day: ex.day,
          name: ex.name,
          muscle: ex.muscle,
          imgStart: ex.imgStart,
          imgEnd: ex.imgEnd,
          setsReps: ex.setsReps,
          rest: ex.rest,
          rir: ex.rir,
          notes: ex.notes,
          circuitRole: ex.circuitRole || null,
          circuitLabel: ex.circuitLabel || ""
        }))
      })
      .select()
      .single();

    if (savedExt && typeof externalWorkoutsList !== "undefined") {
      externalWorkoutsList.unshift(savedExt);
    }
  }
}

// Generazione PDF Stampabile centrata su qualsiasi schermo (Desktop e iOS Safari)
document.getElementById("btnPdf").addEventListener("click", async () => {
  if (currentWorkout.length === 0) {
    alert("Inserisci almeno un esercizio prima di generare il PDF!");
    return;
  }

  const btn = document.getElementById("btnPdf");
  btn.disabled = true;
  btn.textContent = "⏳ Creazione PDF...";

  const athleteId = document.getElementById("builderAthleteSelect").value || null;
  const athleteName = document.getElementById("athleteName").value.trim() || "Atleta";
  const durationWeeks = document.getElementById("durationWeeks").value || "4";
  const generalNotes = document.getElementById("generalNotes").value.trim();

  const grouped = {};
  currentWorkout.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = [];
    grouped[item.day].push({
      name: item.name,
      muscle: item.muscle,
      imgStart: item.imgStart,
      imgEnd: item.imgEnd,
      setsReps: item.setsReps,
      rest: item.rest,
      rir: item.rir,
      notes: item.notes,
      circuitRole: item.circuitRole,
      circuitLabel: item.circuitLabel
    });
  });

  try {
    await savePdfSnapshotToHistory({
      athleteId,
      athleteName,
      durationWeeks,
      generalNotes,
      items: currentWorkout
    });

    await window.exportPaginatedWorkoutPdf({
      athleteName,
      durationWeeks,
      generalNotes,
      coachName: currentProfile ? currentProfile.full_name : "",
      groupedDays: grouped,
      fileName: `Scheda_${athleteName.replace(/\s+/g, '_')}.pdf`
    });
  } finally {
    btn.disabled = false;
    btn.textContent = "📄 Scarica PDF";
  }
});

syncSaveCloudButtonState();
