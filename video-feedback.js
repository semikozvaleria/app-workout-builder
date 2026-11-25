// ============================================================
// GESTIONE VIDEO ESECUZIONE & NOTA TECNICA COACH
// ============================================================

const VIDEO_STORAGE_BUCKET = "exercise-videos";
const MAX_VIDEO_DURATION_SEC = 30;
const MAX_RAW_UPLOAD_MB = 30;

// Verifica durata (sempre, max 30s) + compressione lato client a max 720p
async function validateAndCompressVideo(file, onProgressText) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      // Controllo rigido durata massima (30 secondi + 1s di tolleranza per arrotondamenti codec)
      if (video.duration && video.duration > MAX_VIDEO_DURATION_SEC + 1) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          error: `Il video dura ${Math.round(video.duration)} secondi. Il limite massimo consentito è di ${MAX_VIDEO_DURATION_SEC} secondi.`
        });
        return;
      }

      // Se il file è già leggero (<= 8 MB), non serve ricodificarlo
      if (file.size <= 8 * 1024 * 1024) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      const maxDim = 720;
      let width = video.videoWidth || 720;
      let height = video.videoHeight || 1280;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
        ? "video/mp4;codecs=avc1"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "";

      if (!mimeType) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      try {
        if (onProgressText) onProgressText("⏳ Ottimizzazione video in corso...");
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        const stream = canvas.captureStream(24);
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1200000 // ~1.2 Mbps
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          URL.revokeObjectURL(objectUrl);
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          const compressedBlob = new Blob(chunks, { type: mimeType.split(";")[0] });
          if (compressedBlob.size > 0 && compressedBlob.size < file.size) {
            const compressedFile = new File([compressedBlob], `exec_${Date.now()}.${ext}`, {
              type: compressedBlob.type
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        };

        recorder.start(250);
        await video.play();

        const drawFrame = () => {
          if (video.paused || video.ended) {
            if (recorder.state !== "inactive") recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        };
        requestAnimationFrame(drawFrame);

        video.onended = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
      } catch (err) {
        console.warn("Fallback upload video originale:", err);
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
}

// Genera Signed URL temporaneo (1 ora) per riprodurre un video privato
async function getSignedExerciseVideoUrl(videoPath) {
  if (!videoPath) return null;
  const { data, error } = await supabaseClient.storage
    .from(VIDEO_STORAGE_BUCKET)
    .createSignedUrl(videoPath, 3600);
  if (error || !data) {
    console.warn("Errore signed URL video:", error);
    return null;
  }
  return data.signedUrl;
}

// Riproduzione on-demand cliccando sul pulsante "Guarda Video"
window.playExerciseVideoFeedback = async function(feedbackId, videoPath) {
  const box = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (!box) return;

  if (!box.classList.contains("hidden") && box.querySelector("video")) {
    box.classList.add("hidden");
    const vid = box.querySelector("video");
    if (vid) vid.pause();
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">⏳ Caricamento video sicuro...</div>`;

  const signedUrl = await getSignedExerciseVideoUrl(videoPath);
  if (!signedUrl) {
    box.innerHTML = `<div style="font-size: 0.78rem; color: var(--danger); padding: 6px;">Video non più disponibile (potrebbe essere stato rimosso dalla pulizia automatica a 45 giorni).</div>`;
    return;
  }

  box.innerHTML = `
    <video controls playsinline preload="metadata" style="width: 100%; max-height: 340px; border-radius: 8px; background: #000; margin-top: 6px;">
      <source src="${signedUrl}">
      Il tuo browser non supporta la riproduzione video.
    </video>
  `;
};

// Upload video da parte dell'Atleta
window.uploadAthleteExerciseVideo = async function(workoutId, exerciseIndex, exerciseName, domKey) {
  const fileInput = document.getElementById(`videoFileInput_${domKey}`);
  const noteInput = document.getElementById(`videoAthleteNote_${domKey}`);
  const btn = document.getElementById(`btnUploadVideo_${domKey}`);
  const statusEl = document.getElementById(`videoUploadStatus_${domKey}`);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Seleziona o registra prima un video dell'esecuzione (max 30 secondi).");
    return;
  }

  const rawFile = fileInput.files[0];
  if (rawFile.size > MAX_RAW_UPLOAD_MB * 1024 * 1024) {
    alert(`Il video supera i ${MAX_RAW_UPLOAD_MB} MB. Registra una clip più breve (max ${MAX_VIDEO_DURATION_SEC}s).`);
    return;
  }

  if (!currentProfile || !currentProfile.trainer_id) {
    alert("Devi essere collegato a un coach per inviare video.");
    return;
  }

  btn.disabled = true;
  const origBtnText = btn.textContent;
  btn.textContent = "⏳ Invio...";
  if (statusEl) statusEl.textContent = "Controllo durata e preparazione...";

  try {
    const processed = await validateAndCompressVideo(rawFile, (txt) => {
      if (statusEl) statusEl.textContent = txt;
    });

    if (processed && processed.error) {
      alert(processed.error);
      return;
    }

    const fileToUpload = processed;
    const ext = (fileToUpload.name.split(".").pop() || "mp4").toLowerCase();
    const storagePath = `${currentProfile.trainer_id}/${currentProfile.id}/${workoutId}_${exerciseIndex}_${Date.now()}.${ext}`;

    if (statusEl) statusEl.textContent = "☁️ Caricamento su cloud...";

    const { error: uploadErr } = await supabaseClient.storage
      .from(VIDEO_STORAGE_BUCKET)
      .upload(storagePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileToUpload.type || "video/mp4"
      });

    if (uploadErr) {
      throw new Error("Errore upload storage: " + uploadErr.message);
    }

    const athleteNote = noteInput ? noteInput.value.trim() : "";

    const { error: dbErr } = await supabaseClient
      .from("exercise_video_feedbacks")
      .insert({
        workout_id: workoutId,
        exercise_index: exerciseIndex,
        exercise_name: exerciseName,
        athlete_id: currentProfile.id,
        coach_id: currentProfile.trainer_id,
        video_path: storagePath,
        athlete_note: athleteNote || null,
        status: "pending",
        athlete_seen_at: new Date().toISOString()
      });

    if (dbErr) {
      await supabaseClient.storage.from(VIDEO_STORAGE_BUCKET).remove([storagePath]);
      throw new Error("Errore salvataggio record: " + dbErr.message);
    }

    alert("🎥 Video inviato al Coach! Riceverai una notifica appena inserirà la sua nota tecnica.");
    if (typeof loadAthleteWorkout === "function") {
      await loadAthleteWorkout();
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "Errore durante l'invio del video.");
  } finally {
    btn.disabled = false;
    btn.textContent = origBtnText;
    if (statusEl) statusEl.textContent = "";
  }
};

// Eliminazione video da parte dell'atleta
window.deleteAthleteExerciseVideo = async function(feedbackId, videoPath) {
  if (!confirm("Vuoi eliminare questo video?")) return;

  if (videoPath) {
    await supabaseClient.storage.from(VIDEO_STORAGE_BUCKET).remove([videoPath]);
  }

  const { error } = await supabaseClient
    .from("exercise_video_feedbacks")
    .delete()
    .eq("id", feedbackId)
    .eq("athlete_id", currentProfile.id);

  if (error) {
    alert("Errore eliminazione video: " + error.message);
    return;
  }

  if (typeof loadAthleteWorkout === "function") {
    await loadAthleteWorkout();
  }
};

// Salvataggio Nota Tecnica del Coach sul video
window.saveCoachVideoFeedback = async function(feedbackId, clientId, clientName, selectedWorkoutId) {
  const textarea = document.getElementById(`coachVideoNoteInput_${feedbackId}`);
  if (!textarea) return;
  const feedbackText = textarea.value.trim();

  if (!feedbackText) {
    alert("Scrivi una nota tecnica prima di salvare.");
    return;
  }

  const { error } = await supabaseClient
    .from("exercise_video_feedbacks")
    .update({
      coach_feedback: feedbackText,
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      athlete_seen_at: null
    })
    .eq("id", feedbackId)
    .eq("coach_id", currentProfile.id);

  if (error) {
    alert("Errore salvataggio nota tecnica: " + error.message);
    return;
  }

  alert("✅ Nota tecnica inviata all'atleta!");
  if (typeof viewClientProgress === "function") {
    await viewClientProgress(clientId, clientName, selectedWorkoutId);
  }
  if (typeof loadTrainerClients === "function") {
    loadTrainerClients();
  }
};

// HTML del blocco Video lato ATLETA (dentro Modalità Allenamento)
function buildAthleteVideoSectionHtml(row, videoFeedbacksForExercise) {
  const domKey = row.id;
  const list = videoFeedbacksForExercise || [];
  const coachFirstName = typeof getAthleteFirstName === "function"
    ? getAthleteFirstName(currentAthleteCoachName, "Coach")
    : "Coach";

  const historyHtml = list.map((vf) => {
    const dateStr = new Date(vf.created_at).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    });
    const isReviewed = vf.status === "reviewed" && vf.coach_feedback;
    const statusBadge = isReviewed
      ? `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`
      : `<span style="font-size:0.68rem; background:rgba(245,158,11,0.18); color:#f59e0b; padding:1px 6px; border-radius:4px; font-weight:700;">⏳ In attesa del Coach</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 7px; padding: 8px; margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 0.74rem; color: var(--text-muted);">🎥 Clip del ${dateStr} ${statusBadge}</span>
          <div style="display: flex; gap: 5px;">
            ${vf.video_path ? `<button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}')">▶️ Guarda</button>` : `<span style="font-size:0.7rem; color:var(--text-muted);">File archiviato</span>`}
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.72rem; width: auto; border-color: var(--danger); color: var(--danger);" onclick="deleteAthleteExerciseVideo('${vf.id}', '${escapeHtml(vf.video_path || "")}')">🗑️</button>
          </div>
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.76rem; margin-top: 4px; color: var(--text);"><strong>La tua nota:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>
          ${isReviewed ? `<div class="note-coach-box" style="margin-top: 6px; white-space: pre-wrap; text-align: left;"><strong>Nota Tecnica ${escapeHtml(coachFirstName)}:</strong>\n${escapeHtml(vf.coach_feedback)}</div>` : ""}
        ` : ""}
      </div>
    `;
  }).join("");

  const exName = row.exercises ? row.exercises.name : "Esercizio";
  const pendingCount = list.filter(v => v.status === "pending").length;
  const reviewedCount = list.filter(v => v.status === "reviewed").length;
  const badgeSummary = list.length > 0
    ? `(${list.length}${reviewedCount > 0 ? ` • ${reviewedCount} ✅` : ""}${pendingCount > 0 ? ` • ${pendingCount} ⏳` : ""})`
    : "";

  return `
    <details style="margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 6px;" ${list.some(v => v.coach_feedback && !v.athlete_seen_at) ? "open" : ""}>
      <summary style="cursor: pointer; font-size: 0.77rem; font-weight: 700; color: var(--primary);">
        🎥 Aggiungi video esecuzione dell'esercizio ${badgeSummary}
      </summary>
      <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <input type="file" id="videoFileInput_${domKey}" accept="video/*" style="flex: 1; font-size: 0.74rem; padding: 5px; min-width: 160px;">
          <span style="font-size: 0.7rem; color: var(--text-muted);">Max ${MAX_VIDEO_DURATION_SEC} sec</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: flex-end;">
          <input type="text" id="videoAthleteNote_${domKey}" placeholder="Chiedi un parere al coach (es. schiena in basso?)..." style="flex: 1; font-size: 0.76rem; padding: 6px 8px;">
          <button type="button" id="btnUploadVideo_${domKey}" class="btn btn-primary btn-sm" style="width: auto; white-space: nowrap;" onclick="uploadAthleteExerciseVideo('${row.workout_id}', ${row.order_index}, '${escapeHtml(exName).replace(/'/g, "\\'")}', '${domKey}')">📤 Invia Video</button>
        </div>
        <div id="videoUploadStatus_${domKey}" style="font-size: 0.72rem; color: var(--primary);"></div>
        ${historyHtml}
      </div>
    </details>
  `;
}

// HTML del blocco Video lato COACH (dentro Progressi Atleta)
function buildTrainerVideoFeedbackHtml(videoFeedbacksForExercise, clientId, clientName, workoutId) {
  if (!videoFeedbacksForExercise || videoFeedbacksForExercise.length === 0) {
    return "";
  }

  const cardsHtml = videoFeedbacksForExercise.map((vf) => {
    const dateStr = new Date(vf.created_at).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    });
    const isPending = vf.status === "pending";
    const badge = isPending
      ? `<span style="font-size:0.68rem; background:rgba(239,68,68,0.18); color:#ef4444; padding:1px 6px; border-radius:4px; font-weight:700;">● DA REVISIONARE</span>`
      : `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1.5px solid ${isPending ? "#ef4444" : "var(--border)"}; border-radius: 8px; padding: 9px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <strong style="font-size: 0.78rem;">🎥 Video Esecuzione (${dateStr}) ${badge}</strong>
          ${vf.video_path
            ? `<button type="button" class="btn btn-primary btn-sm" style="padding: 3px 9px; font-size: 0.74rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}')">▶️ Guarda Video</button>`
            : `<span style="font-size: 0.72rem; color: var(--text-muted);">Video rimosso (>45 gg)</span>`}
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.78rem; margin-top: 5px; color: var(--text);"><strong>Domanda Atleta:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>

        <div style="margin-top: 7px;">
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 3px;">Nota Tecnica del Coach:</label>
          <div style="display: flex; gap: 6px; align-items: flex-end;">
            <textarea id="coachVideoNoteInput_${vf.id}" rows="2" placeholder="Scrivi correzione tecnica, postura, tempo di esecuzione..." style="flex: 1; min-height: 46px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;">${escapeHtml(vf.coach_feedback || "")}</textarea>
            <button type="button" class="btn btn-success btn-sm" style="width: auto; align-self: stretch;" onclick="saveCoachVideoFeedback('${vf.id}', '${clientId}', '${escapeHtml(clientName).replace(/'/g, "\\'")}', '${workoutId}')">💾 Salva</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `<div style="margin-top: 6px;">${cardsHtml}</div>`;
}
