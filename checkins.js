// =========================================================
// MODULO CHECK-IN DI FINE SETTIMANA (ATLETA -> COACH)
// =========================================================

function escapeCheckinHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCheckinDateIt(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// --- INIZIALIZZAZIONE TAB ATLETA ---
function initAthleteCheckinTabs() {
  const navTabs = document.getElementById("athleteNavTabs");
  const btnWorkout = document.getElementById("navAthleteWorkout");
  const btnCheckin = document.getElementById("navAthleteCheckin");
  const workoutCard = document.getElementById("athleteWorkoutCard");
  const checkinCard = document.getElementById("athleteCheckinCard");
  const dateInput = document.getElementById("checkinDate");

  if (!navTabs || !btnWorkout || !btnCheckin) return;

  if (typeof currentProfile !== "undefined" && currentProfile && currentProfile.role === "athlete" && currentProfile.trainer_id) {
    navTabs.classList.remove("hidden");
  } else {
    navTabs.classList.add("hidden");
    return;
  }

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  btnWorkout.onclick = () => {
    btnWorkout.classList.replace("btn-outline", "btn-primary");
    btnCheckin.classList.replace("btn-primary", "btn-outline");
    if (checkinCard) checkinCard.classList.add("hidden");
    if (workoutCard) workoutCard.classList.remove("hidden");
  };

  btnCheckin.onclick = () => {
    btnCheckin.classList.replace("btn-outline", "btn-primary");
    btnWorkout.classList.replace("btn-primary", "btn-outline");
    if (workoutCard) workoutCard.classList.add("hidden");
    if (checkinCard) checkinCard.classList.remove("hidden");
    loadAthleteCheckinsHistory();
  };
}

// --- CARICAMENTO STORICO ATLETA ---
async function loadAthleteCheckinsHistory() {
  const container = document.getElementById("athleteCheckinsHistoryContainer");
  if (!container || !currentProfile) return;

  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Caricamento storico...</div>`;

  const { data, error } = await supabaseClient
    .from("weekly_checkins")
    .select("*")
    .eq("athlete_id", currentProfile.id)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.82rem;">Errore caricamento: ${escapeCheckinHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 8px;">Nessun check-in inviato finora.</div>`;
    return;
  }

  container.innerHTML = data.map((item) => {
    const weightTxt = item.weight_kg !== null && item.weight_kg !== undefined ? `<strong>${item.weight_kg} kg</strong>` : "Peso n/d";
    const coachReplyHtml = item.coach_feedback
      ? `<div style="margin-top: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(14, 165, 233, 0.12); border-left: 3px solid var(--primary); font-size: 0.8rem;">
           <strong>Risposta Coach:</strong> ${escapeCheckinHtml(item.coach_feedback)}
         </div>`
      : `<div style="margin-top: 6px; font-size: 0.75rem; color: var(--text-muted);">In attesa di revisione del coach</div>`;

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 0.84rem; color: var(--primary);">📅 ${formatCheckinDateIt(item.checkin_date)}</strong>
          <span style="font-size: 0.84rem;">⚖️ ${weightTxt}</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 6px;">
          <span>Aderenza: <strong>${item.adherence_score ?? "-"}/5</strong></span>
          <span>• Sonno: <strong>${item.sleep_score ?? "-"}/5</strong></span>
          <span>• Energia: <strong>${item.energy_score ?? "-"}/5</strong></span>
          <span>• Stress/Dolori: <strong>${item.stress_score ?? "-"}/5</strong></span>
        </div>
        ${item.athlete_notes ? `<div style="font-size: 0.82rem; white-space: pre-wrap;">${escapeCheckinHtml(item.athlete_notes)}</div>` : ""}
        ${coachReplyHtml}
      </div>
    `;
  }).join("");
}

// --- INVIO NUOVO CHECK-IN (ATLETA) ---
const btnSubmitWeeklyCheckin = document.getElementById("btnSubmitWeeklyCheckin");
if (btnSubmitWeeklyCheckin) {
  btnSubmitWeeklyCheckin.addEventListener("click", async () => {
    if (!currentProfile || !currentProfile.trainer_id) {
      alert("Devi prima collegarti a un Personal Trainer per inviare il check-in.");
      return;
    }

    const checkinDate = document.getElementById("checkinDate").value || new Date().toISOString().split("T")[0];
    const weightRaw = document.getElementById("checkinWeightKg").value;
    const weightKg = weightRaw !== "" ? parseFloat(weightRaw) : null;
    const adherence = parseInt(document.getElementById("checkinAdherence").value, 10);
    const sleep = parseInt(document.getElementById("checkinSleep").value, 10);
    const energy = parseInt(document.getElementById("checkinEnergy").value, 10);
    const stress = parseInt(document.getElementById("checkinStress").value, 10);
    const notes = document.getElementById("checkinAthleteNotes").value.trim();

    if (weightKg === null && !notes) {
      alert("Inserisci almeno il peso corporeo oppure una nota settimanale per il coach.");
      return;
    }

    btnSubmitWeeklyCheckin.disabled = true;
    btnSubmitWeeklyCheckin.textContent = "Invio in corso...";

    const { error } = await supabaseClient
      .from("weekly_checkins")
      .insert([{
        athlete_id: currentProfile.id,
        trainer_id: currentProfile.trainer_id,
        checkin_date: checkinDate,
        weight_kg: weightKg,
        adherence_score: adherence,
        sleep_score: sleep,
        energy_score: energy,
        stress_score: stress,
        athlete_notes: notes || null
      }]);

    btnSubmitWeeklyCheckin.disabled = false;
    btnSubmitWeeklyCheckin.textContent = "📤 Invia Check-in al Coach";

    if (error) {
      alert("Errore invio check-in: " + error.message);
      return;
    }

    document.getElementById("checkinAthleteNotes").value = "";
    alert("Check-in inviato con successo al tuo coach!");
    loadAthleteCheckinsHistory();
  });
}

// --- APERTURA VISTA CHECK-IN ATLETA LATO TRAINER ---
async function openTrainerAthleteCheckins(athleteId, athleteName) {
  const viewsToHide = [
    "trainerClientsView",
    "trainerProgressView",
    "trainerWorkoutsView",
    "trainerStatsView",
    "trainerAnamnesisView",
    "trainerBuilderView"
  ];
  viewsToHide.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const checkinsView = document.getElementById("trainerCheckinsView");
  const titleEl = document.getElementById("trainerCheckinsTitle");
  const container = document.getElementById("trainerCheckinsListContainer");

  if (!checkinsView || !container) return;
  checkinsView.classList.remove("hidden");
  if (titleEl) titleEl.textContent = `✅ Check-in — ${athleteName || "Atleta"}`;

  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Caricamento check-in...</div>`;

  const { data, error } = await supabaseClient
    .from("weekly_checkins")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("trainer_id", currentProfile.id)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.84rem;">Errore: ${escapeCheckinHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">Questo atleta non ha ancora inviato nessun check-in settimanale.</div>`;
    return;
  }

  container.innerHTML = data.map((item, idx) => {
    const prevItem = data[idx + 1];
    let deltaBadge = "";
    if (item.weight_kg != null && prevItem && prevItem.weight_kg != null) {
      const diff = (Number(item.weight_kg) - Number(prevItem.weight_kg)).toFixed(1);
      const sign = diff > 0 ? "+" : "";
      deltaBadge = ` <span style="font-size: 0.75rem; color: var(--text-muted);">(${sign}${diff} kg)</span>`;
    }

    const statusBadge = item.reviewed_at
      ? `<span style="font-size: 0.72rem; color: #10b981; font-weight: 600;">✓ Rivisto</span>`
      : `<span style="font-size: 0.72rem; color: #f59e0b; font-weight: 600;">Nuovo</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <div>
            <strong style="font-size: 0.88rem; color: var(--primary);">📅 ${formatCheckinDateIt(item.checkin_date)}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 0.86rem;">
            ⚖️ <strong>${item.weight_kg != null ? item.weight_kg + " kg" : "n/d"}</strong>${deltaBadge}
          </div>
        </div>

        <div class="grid-2" style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; gap: 6px;">
          <div>Aderenza: <strong style="color: var(--text);">${item.adherence_score ?? "-"}/5</strong></div>
          <div>Sonno: <strong style="color: var(--text);">${item.sleep_score ?? "-"}/5</strong></div>
          <div>Energia: <strong style="color: var(--text);">${item.energy_score ?? "-"}/5</strong></div>
          <div>Stress/Dolori: <strong style="color: var(--text);">${item.stress_score ?? "-"}/5</strong></div>
        </div>

        ${item.athlete_notes ? `<div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 0.82rem; margin-bottom: 8px; white-space: pre-wrap;">${escapeCheckinHtml(item.athlete_notes)}</div>` : ""}

        <div class="field" style="margin-bottom: 6px;">
          <label style="font-size: 0.76rem;">Feedback / Risposta Coach</label>
          <textarea id="coachCheckinReply_${item.id}" rows="2" style="min-height: 54px; font-size: 0.82rem;" placeholder="Scrivi il tuo feedback per l'atleta...">${escapeCheckinHtml(item.coach_feedback || "")}</textarea>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="saveCoachCheckinFeedback('${item.id}', '${athleteId}', '${escapeCheckinHtml(athleteName || "")}')" style="width: auto;">💾 Salva Feedback</button>
      </div>
    `;
  }).join("");
}

async function saveCoachCheckinFeedback(checkinId, athleteId, athleteName) {
  const textarea = document.getElementById(`coachCheckinReply_${checkinId}`);
  if (!textarea) return;
  const feedbackText = textarea.value.trim();

  const { error } = await supabaseClient
    .from("weekly_checkins")
    .update({
      coach_feedback: feedbackText || null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", checkinId)
    .eq("trainer_id", currentProfile.id);

  if (error) {
    alert("Errore salvataggio feedback: " + error.message);
    return;
  }

  alert("Feedback salvato e inviato all'atleta!");
  openTrainerAthleteCheckins(athleteId, athleteName);
}

const btnBackFromTrainerCheckins = document.getElementById("btnBackFromTrainerCheckins");
if (btnBackFromTrainerCheckins) {
  btnBackFromTrainerCheckins.addEventListener("click", () => {
    document.getElementById("trainerCheckinsView").classList.add("hidden");
    document.getElementById("trainerClientsView").classList.remove("hidden");
  });
}
