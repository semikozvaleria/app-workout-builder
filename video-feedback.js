// ============================================================
// GESTIONE VIDEO ESECUZIONE, NOTA TECNICA & COMMENTO VOCALE SINCRONIZZATO
// ============================================================

const VIDEO_STORAGE_BUCKET = "exercise-videos";
const MAX_VIDEO_DURATION_SEC = 30;
const MAX_RAW_UPLOAD_MB = 30;
const MAX_COACH_AUDIO_DURATION_SEC = 120; // 2 minuti massimi

// Stato attivo delle registrazioni vocali del Coach per ogni feedbackId
const activeCoachAudioRecorders = new Map();

function formatSecondsMmSs(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

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
      if (video.duration && video.duration > MAX_VIDEO_DURATION_SEC + 1) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          error: `Il video dura ${Math.round(video.duration)} secondi. Il limite massimo consentito è di ${MAX_VIDEO_DURATION_SEC} secondi.`
        });
        return;
      }

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
          videoBitsPerSecond: 1200000
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

// Genera Signed URL temporaneo (1 ora) per video o audio privato (con retry iOS)
async function getSignedExerciseMediaUrl(storagePath) {
  if (!storagePath) return null;
  let { data, error } = await supabaseClient.storage
    .from(VIDEO_STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error && String(error.message || "").includes("Load failed")) {
    await supabaseClient.auth.getSession();
    const retry = await supabaseClient.storage
      .from(VIDEO_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600);
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.warn("Errore signed URL media:", error);
    return null;
  }
  return data.signedUrl;
}

// Riproduzione Video + Sincronizzazione eventuale Commento Audio del Coach (iOS/Android/Desktop safe)
window.playExerciseVideoFeedback = async function(feedbackId, videoPath, audioPath = "", timelineEncoded = "") {
  const box = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (!box) return;

  // Se il box è già aperto -> chiudi e ferma eventuale riproduzione
  if (!box.classList.contains("hidden") && box.querySelector("video")) {
    box.classList.add("hidden");
    const vid = box.querySelector("video");
    if (vid) vid.pause();
    if (box._stopSyncPlayback) box._stopSyncPlayback();
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">Caricamento video...</div>`;

  const [signedVideoUrl, signedAudioUrl] = await Promise.all([
    getSignedExerciseMediaUrl(videoPath),
    audioPath ? getSignedExerciseMediaUrl(audioPath) : Promise.resolve(null)
  ]);

  if (!signedVideoUrl) {
    box.innerHTML = `<div style="font-size: 0.78rem; color: var(--danger); padding: 6px;">Video non più disponibile (rimosso dalla pulizia automatica a 45 giorni).</div>`;
    return;
  }

  let timeline = [];
  if (timelineEncoded) {
    try {
      timeline = JSON.parse(decodeURIComponent(timelineEncoded));
    } catch (_) {
      timeline = [];
    }
  }

  const audioSectionHtml = signedAudioUrl ? `
    <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: rgba(56, 189, 248, 0.10); border: 1px solid rgba(56, 189, 248, 0.35);">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8;">Commento audio del Coach</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span id="syncTimerLabel_${feedbackId}" style="font-size: 0.72rem; color: var(--text-muted);">0:00</span>
          <button type="button" id="btnSyncPlay_${feedbackId}" class="btn btn-primary btn-sm" style="width: auto; padding: 4px 12px; font-size: 0.74rem;">
            ▶️ Ascolta con video
          </button>
        </div>
      </div>
      <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.12); border-radius: 99px; margin-top: 7px; overflow: hidden;">
        <div id="syncProgressBar_${feedbackId}" style="width: 0%; height: 100%; background: #38bdf8; transition: width 0.1s linear;"></div>
      </div>
    </div>
  ` : "";

  box.innerHTML = `
    <video id="exerciseFeedbackVideo_${feedbackId}" controls playsinline webkit-playsinline preload="metadata" style="width: 100%; max-height: 340px; border-radius: 8px; background: #000; margin-top: 6px;">
      <source src="${signedVideoUrl}">
      Il tuo browser non supporta la riproduzione video.
    </video>
    ${audioSectionHtml}
  `;

  if (!signedAudioUrl) return;

  const videoEl = document.getElementById(`exerciseFeedbackVideo_${feedbackId}`);
  const syncBtn = document.getElementById(`btnSyncPlay_${feedbackId}`);
  const timerLabel = document.getElementById(`syncTimerLabel_${feedbackId}`);
  const progressBar = document.getElementById(`syncProgressBar_${feedbackId}`);

  // Stato riproduzione Web Audio API (indipendente dal <video> su Safari iOS)
  let audioCtx = null;
  let audioBuffer = null;
  let sourceNode = null;
  let isPlaying = false;
  let startedAtCtxTime = 0;
  let pausedOffsetSec = 0;
  let rafId = null;

  const stopPlayback = (resetToStart = false) => {
    isPlaying = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (sourceNode) {
      try { sourceNode.onended = null; sourceNode.stop(); } catch (_) {}
      sourceNode = null;
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.controls = true;
    }
    if (resetToStart) {
      pausedOffsetSec = 0;
      if (progressBar) progressBar.style.width = "0%";
      if (timerLabel && audioBuffer) {
        timerLabel.textContent = `0:00 / ${formatSecondsMmSs(Math.round(audioBuffer.duration))}`;
      }
    }
    if (syncBtn) syncBtn.textContent = "▶️ Ascolta con video";
  };

  box._stopSyncPlayback = () => {
    stopPlayback(true);
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  };

  const applyTimelineAt = (t) => {
    if (!videoEl || !timeline || timeline.length === 0) return;

    let activeEvt = timeline[0];
    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].t <= t) {
        activeEvt = timeline[i];
      } else {
        break;
      }
    }
    if (!activeEvt) return;

    if (activeEvt.paused) {
      if (!videoEl.paused) videoEl.pause();
      if (Math.abs(videoEl.currentTime - activeEvt.videoTime) > 0.25) {
        videoEl.currentTime = activeEvt.videoTime;
      }
    } else {
      const expectedVideoTime = activeEvt.videoTime + Math.max(0, t - activeEvt.t);
      if (Math.abs(videoEl.currentTime - expectedVideoTime) > 0.45) {
        videoEl.currentTime = Math.min(expectedVideoTime, videoEl.duration || expectedVideoTime);
      }
      if (videoEl.paused && expectedVideoTime < (videoEl.duration || 999)) {
        videoEl.play().catch(() => {});
      }
    }
  };

  const tick = () => {
    if (!isPlaying || !audioCtx || !audioBuffer) return;
    const elapsed = pausedOffsetSec + (audioCtx.currentTime - startedAtCtxTime);
    const total = audioBuffer.duration || 1;

    if (elapsed >= total) {
      stopPlayback(true);
      return;
    }

    if (timerLabel) {
      timerLabel.textContent = `${formatSecondsMmSs(Math.floor(elapsed))} / ${formatSecondsMmSs(Math.round(total))}`;
    }
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
    }

    applyTimelineAt(elapsed);
    rafId = requestAnimationFrame(tick);
  };

  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      if (isPlaying) {
        pausedOffsetSec += audioCtx.currentTime - startedAtCtxTime;
        stopPlayback(false);
        syncBtn.textContent = "▶️ Riprendi";
        return;
      }

      try {
        syncBtn.disabled = true;
        syncBtn.textContent = "⏳ Caricamento...";

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        if (!audioBuffer) {
          const resp = await fetch(signedAudioUrl);
          const arrayBuf = await resp.arrayBuffer();
          audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        }

        videoEl.muted = true;
        videoEl.controls = false;
        if (pausedOffsetSec === 0) {
          videoEl.currentTime = timeline.length > 0 ? timeline[0].videoTime : 0;
        }

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioCtx.destination);
        sourceNode.onended = () => {
          if (isPlaying) stopPlayback(true);
        };

        startedAtCtxTime = audioCtx.currentTime;
        isPlaying = true;
        sourceNode.start(0, pausedOffsetSec);

        syncBtn.disabled = false;
        syncBtn.textContent = "⏸️ Pausa";
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        console.error("Errore riproduzione audio sync:", err);
        syncBtn.disabled = false;
        syncBtn.textContent = "▶️ Ascolta con video";
        alert("Impossibile avviare l'audio: " + err.message);
      }
    });
  }
};

// ============================================================
// REGISTRAZIONE VOCALE DEL COACH SOPRA IL VIDEO (MAX 2 MINUTI)
// ============================================================

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

window.toggleCoachAudioRecording = async function(feedbackId, videoPath) {
  const btnRec = document.getElementById(`btnRecordCoachAudio_${feedbackId}`);
  const statusEl = document.getElementById(`coachAudioRecStatus_${feedbackId}`);
  const previewWrap = document.getElementById(`coachAudioPreviewWrap_${feedbackId}`);

  // Se sta già registrando -> FERMA la registrazione
  if (activeCoachAudioRecorders.has(feedbackId)) {
    const state = activeCoachAudioRecorders.get(feedbackId);
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.recorder && state.recorder.state !== "inactive") {
      state.recorder.stop();
    }
    return;
  }

  // Apri il video se non è già aperto, così il coach può metterlo in pausa mentre parla
  const playerBox = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (playerBox && (playerBox.classList.contains("hidden") || !playerBox.querySelector("video"))) {
    await window.playExerciseVideoFeedback(feedbackId, videoPath);
  }

  const videoEl = document.getElementById(`exerciseFeedbackVideo_${feedbackId}`);
  if (!videoEl) {
    alert("Impossibile aprire il player video per la registrazione.");
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Il tuo browser non supporta la registrazione microfono.");
    return;
  }

  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedAudioMimeType();
    const recorder = mimeType
      ? new MediaRecorder(micStream, { mimeType, audioBitsPerSecond: 64000 })
      : new MediaRecorder(micStream);

    const chunks = [];
    const timeline = [];
    const startTimeMs = Date.now();

    const recordEvent = () => {
      const elapsedSec = Math.round(((Date.now() - startTimeMs) / 1000) * 100) / 100;
      timeline.push({
        t: elapsedSec,
        videoTime: Math.round((videoEl.currentTime || 0) * 100) / 100,
        paused: Boolean(videoEl.paused)
      });
    };

    recordEvent();
    const onVideoEvent = () => recordEvent();
    videoEl.addEventListener("play", onVideoEvent);
    videoEl.addEventListener("pause", onVideoEvent);
    videoEl.addEventListener("seeked", onVideoEvent);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      videoEl.removeEventListener("play", onVideoEvent);
      videoEl.removeEventListener("pause", onVideoEvent);
      videoEl.removeEventListener("seeked", onVideoEvent);
      micStream.getTracks().forEach((tr) => tr.stop());

      const currentState = activeCoachAudioRecorders.get(feedbackId);
      if (currentState && currentState.timerInterval) clearInterval(currentState.timerInterval);

      const finalMime = (recorder.mimeType || mimeType || "audio/mp4").split(";")[0];
      const audioBlob = new Blob(chunks, { type: finalMime });
      const audioPreviewUrl = URL.createObjectURL(audioBlob);

      activeCoachAudioRecorders.set(feedbackId, {
        recordedBlob: audioBlob,
        mimeType: finalMime,
        timeline
      });

      if (btnRec) {
        btnRec.textContent = "Registra di nuovo";
        btnRec.style.background = "";
        btnRec.style.color = "";
      }
      if (statusEl) {
        statusEl.textContent = `Audio pronto. Clicca "Salva" per inviarlo.`;
      }
      if (previewWrap) {
        previewWrap.classList.remove("hidden");
        previewWrap.innerHTML = `
          <div style="margin-top: 6px; padding: 6px; border-radius: 6px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:0.72rem; font-weight:700; color:#10b981;">Anteprima commento audio:</span>
              <button type="button" class="btn btn-outline btn-sm" style="padding:1px 6px; font-size:0.68rem; width:auto; border-color:var(--danger); color:var(--danger);" onclick="discardCoachRecordedAudio('${feedbackId}')">Scarta</button>
            </div>
            <audio controls playsinline src="${audioPreviewUrl}" style="width: 100%; height: 32px;"></audio>
          </div>
        `;
      }
    };

    // Avvia registrazione (limite massimo 2 minuti = 120s)
    recorder.start(250);
    videoEl.muted = true;
    videoEl.play().catch(() => {});

    let sec = 0;
    const maxFormatted = formatSecondsMmSs(MAX_COACH_AUDIO_DURATION_SEC);
    if (btnRec) {
      btnRec.textContent = `Stop (0:00 / ${maxFormatted})`;
      btnRec.style.background = "#ef4444";
      btnRec.style.color = "#fff";
    }
    if (statusEl) {
      statusEl.textContent = "Registrazione in corso: commenta e metti in pausa il video nei punti chiave (max 2 min).";
    }

    const timerInterval = setInterval(() => {
      sec++;
      if (btnRec) btnRec.textContent = `Stop (${formatSecondsMmSs(sec)} / ${maxFormatted})`;
      if (sec >= MAX_COACH_AUDIO_DURATION_SEC && recorder.state !== "inactive") {
        recorder.stop();
      }
    }, 1000);

    activeCoachAudioRecorders.set(feedbackId, {
      recorder,
      timerInterval
    });
  } catch (err) {
    console.error(err);
    alert("Permesso microfono negato o non disponibile: " + err.message);
  }
};

window.discardCoachRecordedAudio = function(feedbackId) {
  activeCoachAudioRecorders.delete(feedbackId);
  const previewWrap = document.getElementById(`coachAudioPreviewWrap_${feedbackId}`);
  const statusEl = document.getElementById(`coachAudioRecStatus_${feedbackId}`);
  const btnRec = document.getElementById(`btnRecordCoachAudio_${feedbackId}`);
  if (previewWrap) {
    previewWrap.classList.add("hidden");
    previewWrap.innerHTML = "";
  }
  if (statusEl) statusEl.textContent = "";
  if (btnRec) btnRec.textContent = "Registra commento audio";
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

    let { error: uploadErr } = await supabaseClient.storage
      .from(VIDEO_STORAGE_BUCKET)
      .upload(storagePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileToUpload.type || "video/mp4"
      });

    if (uploadErr && String(uploadErr.message || "").includes("Load failed")) {
      await supabaseClient.auth.getSession();
      const retryUpload = await supabaseClient.storage
        .from(VIDEO_STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileToUpload.type || "video/mp4"
        });
      uploadErr = retryUpload.error;
    }

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

// Eliminazione video (e eventuale audio coach) da parte dell'atleta
window.deleteAthleteExerciseVideo = async function(feedbackId, videoPath, audioPath = "") {
  if (!confirm("Vuoi eliminare questo video?")) return;

  const pathsToDelete = [videoPath, audioPath].filter(Boolean);
  if (pathsToDelete.length > 0) {
    await supabaseClient.storage.from(VIDEO_STORAGE_BUCKET).remove(pathsToDelete);
  }

  let { error } = await supabaseClient
    .from("exercise_video_feedbacks")
    .delete()
    .eq("id", feedbackId)
    .eq("athlete_id", currentProfile.id);

  if (error && String(error.message || "").includes("Load failed")) {
    await supabaseClient.auth.getSession();
    const retry = await supabaseClient
      .from("exercise_video_feedbacks")
      .delete()
      .eq("id", feedbackId)
      .eq("athlete_id", currentProfile.id);
    error = retry.error;
  }

  if (error) {
    alert("Errore eliminazione video: " + error.message);
    return;
  }

  if (typeof loadAthleteWorkout === "function") {
    await loadAthleteWorkout();
  }
};

// Salvataggio Nota Tecnica e/o Audio Vocale del Coach sul video
window.saveCoachVideoFeedback = async function(feedbackId, clientId, clientName, selectedWorkoutId) {
  const textarea = document.getElementById(`coachVideoNoteInput_${feedbackId}`);
  const feedbackText = textarea ? textarea.value.trim() : "";
  const recState = activeCoachAudioRecorders.get(feedbackId);
  const hasNewRecordedAudio = Boolean(recState && recState.recordedBlob);

  if (!feedbackText && !hasNewRecordedAudio) {
    alert("Scrivi una nota tecnica oppure registra un commento audio prima di salvare.");
    return;
  }

  const saveBtn = document.getElementById(`btnSaveCoachVideo_${feedbackId}`);
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳...";
  }

  try {
    let uploadedAudioPath = null;
    let uploadedTimeline = null;

    if (hasNewRecordedAudio) {
      const ext = recState.mimeType.includes("webm") ? "webm" : recState.mimeType.includes("ogg") ? "ogg" : "m4a";
      const audioStoragePath = `${currentProfile.id}/${clientId}/audio_${feedbackId}_${Date.now()}.${ext}`;

      let { error: audioUpErr } = await supabaseClient.storage
        .from(VIDEO_STORAGE_BUCKET)
        .upload(audioStoragePath, recState.recordedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: recState.mimeType
        });

      if (audioUpErr && String(audioUpErr.message || "").includes("Load failed")) {
        await supabaseClient.auth.getSession();
        const retryUp = await supabaseClient.storage
          .from(VIDEO_STORAGE_BUCKET)
          .upload(audioStoragePath, recState.recordedBlob, {
            cacheControl: "3600",
            upsert: false,
            contentType: recState.mimeType
          });
        audioUpErr = retryUp.error;
      }

      if (audioUpErr) {
        throw new Error("Errore caricamento audio: " + audioUpErr.message);
      }

      uploadedAudioPath = audioStoragePath;
      uploadedTimeline = recState.timeline || [];
    }

    const payload = {
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      athlete_seen_at: null
    };

    if (feedbackText) {
      payload.coach_feedback = feedbackText;
    } else if (uploadedAudioPath) {
      payload.coach_feedback = "Ascolta il commento sul video";
    }

    if (uploadedAudioPath) {
      payload.coach_audio_path = uploadedAudioPath;
      payload.coach_audio_timeline = uploadedTimeline;
    }

    let { error } = await supabaseClient
      .from("exercise_video_feedbacks")
      .update(payload)
      .eq("id", feedbackId)
      .eq("coach_id", currentProfile.id);

    if (error && String(error.message || "").includes("Load failed")) {
      await supabaseClient.auth.getSession();
      const retry = await supabaseClient
        .from("exercise_video_feedbacks")
        .update(payload)
        .eq("id", feedbackId)
        .eq("coach_id", currentProfile.id);
      error = retry.error;
    }

    if (error) {
      throw new Error("Errore salvataggio nota tecnica: " + error.message);
    }

    activeCoachAudioRecorders.delete(feedbackId);
    alert("✅ Feedback inviato all'atleta!");

    if (typeof viewClientProgress === "function") {
      await viewClientProgress(clientId, clientName, selectedWorkoutId);
    }
    if (typeof loadTrainerClients === "function") {
      loadTrainerClients();
    }
  } catch (err) {
    alert(err.message || "Errore durante il salvataggio.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Salva";
    }
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
    const hasAudio = Boolean(vf.coach_audio_path);
    const hasText = Boolean(vf.coach_feedback && vf.coach_feedback !== "Ascolta il commento sul video");
    const isReviewed = vf.status === "reviewed" && (hasAudio || Boolean(vf.coach_feedback));
    const timelineEncoded = vf.coach_audio_timeline ? encodeURIComponent(JSON.stringify(vf.coach_audio_timeline)) : "";

    const statusBadge = isReviewed
      ? `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`
      : `<span style="font-size:0.68rem; background:rgba(245,158,11,0.18); color:#f59e0b; padding:1px 6px; border-radius:4px; font-weight:700;">⏳ In attesa del Coach</span>`;

    const coachMessageHtml = isReviewed
      ? `<div class="note-coach-box" style="margin-top: 6px; white-space: pre-wrap; text-align: left;"><strong>Nota Tecnica ${escapeHtml(coachFirstName)}:</strong>${hasAudio ? `\nAscolta il commento sul video` : ""}${hasText ? `\n${escapeHtml(vf.coach_feedback)}` : ""}</div>`
      : "";

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 7px; padding: 8px; margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 0.74rem; color: var(--text-muted);">🎥 Clip del ${dateStr} ${statusBadge}</span>
          <div style="display: flex; gap: 5px;">
            ${vf.video_path ? `<button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}', '${escapeHtml(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda</button>` : `<span style="font-size:0.7rem; color:var(--text-muted);">File archiviato</span>`}
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.72rem; width: auto; border-color: var(--danger); color: var(--danger);" onclick="deleteAthleteExerciseVideo('${vf.id}', '${escapeHtml(vf.video_path || "")}', '${escapeHtml(vf.coach_audio_path || "")}')">🗑️</button>
          </div>
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.76rem; margin-top: 4px; color: var(--text);"><strong>La tua nota:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>
        ${coachMessageHtml}
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
    <details style="margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 6px;" ${list.some(v => (v.coach_feedback || v.coach_audio_path) && !v.athlete_seen_at) ? "open" : ""}>
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
    const hasAudio = Boolean(vf.coach_audio_path);
    const timelineEncoded = vf.coach_audio_timeline ? encodeURIComponent(JSON.stringify(vf.coach_audio_timeline)) : "";
    const existingText = vf.coach_feedback === "Ascolta il commento sul video" ? "" : (vf.coach_feedback || "");

    const badge = isPending
      ? `<span style="font-size:0.68rem; background:rgba(239,68,68,0.18); color:#ef4444; padding:1px 6px; border-radius:4px; font-weight:700;">● DA REVISIONARE</span>`
      : `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1.5px solid ${isPending ? "#ef4444" : "var(--border)"}; border-radius: 8px; padding: 9px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <strong style="font-size: 0.78rem;">🎥 Video Esecuzione (${dateStr}) ${badge}</strong>
          ${vf.video_path
            ? `<button type="button" class="btn btn-primary btn-sm" style="padding: 3px 9px; font-size: 0.74rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}', '${escapeHtml(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda Video</button>`
            : `<span style="font-size: 0.72rem; color: var(--text-muted);">Video rimosso (>45 gg)</span>`}
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.78rem; margin-top: 5px; color: var(--text);"><strong>Domanda Atleta:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>

        <!-- Sezione Registrazione Vocale Sincronizzata del Coach (max 2 min) -->
        <div style="margin-top: 8px; padding-top: 7px; border-top: 1px dashed var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" id="btnRecordCoachAudio_${vf.id}" class="btn btn-outline btn-sm" style="width: auto; font-size: 0.74rem;" onclick="toggleCoachAudioRecording('${vf.id}', '${escapeHtml(vf.video_path || "")}')">
              ${hasAudio ? "Registra nuovo audio" : "Registra commento audio"}
            </button>
            ${hasAudio ? `<span style="font-size: 0.7rem; color: #10b981; font-weight: 700;">Audio salvato</span>` : `<span style="font-size: 0.7rem; color: var(--text-muted);">Max 2 min</span>`}
          </div>
          <div id="coachAudioRecStatus_${vf.id}" style="font-size: 0.72rem; color: var(--primary); margin-top: 4px;"></div>
          <div id="coachAudioPreviewWrap_${vf.id}" class="hidden"></div>
        </div>

        <div style="margin-top: 7px;">
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 3px;">Nota Tecnica Scritta (opzionale se registri audio):</label>
          <div style="display: flex; gap: 6px; align-items: flex-end;">
            <textarea id="coachVideoNoteInput_${vf.id}" rows="2" placeholder="Scrivi correzione tecnica o aggiungi dettagli all'audio..." style="flex: 1; min-height: 46px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;">${escapeHtml(existingText)}</textarea>
            <button type="button" id="btnSaveCoachVideo_${vf.id}" class="btn btn-success btn-sm" style="width: auto; align-self: stretch;" onclick="saveCoachVideoFeedback('${vf.id}', '${clientId}', '${escapeHtml(clientName).replace(/'/g, "\\'")}', '${workoutId}')">💾 Salva</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `<div style="margin-top: 6px;">${cardsHtml}</div>`;
}// ============================================================
// GESTIONE VIDEO ESECUZIONE, NOTA TECNICA & COMMENTO VOCALE SINCRONIZZATO
// ============================================================

const VIDEO_STORAGE_BUCKET = "exercise-videos";
const MAX_VIDEO_DURATION_SEC = 30;
const MAX_RAW_UPLOAD_MB = 30;
const MAX_COACH_AUDIO_DURATION_SEC = 120; // 2 minuti massimi

// Stato attivo delle registrazioni vocali del Coach per ogni feedbackId
const activeCoachAudioRecorders = new Map();

function formatSecondsMmSs(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

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
      if (video.duration && video.duration > MAX_VIDEO_DURATION_SEC + 1) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          error: `Il video dura ${Math.round(video.duration)} secondi. Il limite massimo consentito è di ${MAX_VIDEO_DURATION_SEC} secondi.`
        });
        return;
      }

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
          videoBitsPerSecond: 1200000
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

// Genera Signed URL temporaneo (1 ora) per video o audio privato (con retry iOS)
async function getSignedExerciseMediaUrl(storagePath) {
  if (!storagePath) return null;
  let { data, error } = await supabaseClient.storage
    .from(VIDEO_STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error && String(error.message || "").includes("Load failed")) {
    await supabaseClient.auth.getSession();
    const retry = await supabaseClient.storage
      .from(VIDEO_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600);
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.warn("Errore signed URL media:", error);
    return null;
  }
  return data.signedUrl;
}

// Riproduzione Video + Sincronizzazione eventuale Commento Audio del Coach (iOS/Android/Desktop safe)
window.playExerciseVideoFeedback = async function(feedbackId, videoPath, audioPath = "", timelineEncoded = "") {
  const box = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (!box) return;

  // Se il box è già aperto -> chiudi e ferma eventuale riproduzione
  if (!box.classList.contains("hidden") && box.querySelector("video")) {
    box.classList.add("hidden");
    const vid = box.querySelector("video");
    if (vid) vid.pause();
    if (box._stopSyncPlayback) box._stopSyncPlayback();
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">Caricamento video...</div>`;

  const [signedVideoUrl, signedAudioUrl] = await Promise.all([
    getSignedExerciseMediaUrl(videoPath),
    audioPath ? getSignedExerciseMediaUrl(audioPath) : Promise.resolve(null)
  ]);

  if (!signedVideoUrl) {
    box.innerHTML = `<div style="font-size: 0.78rem; color: var(--danger); padding: 6px;">Video non più disponibile (rimosso dalla pulizia automatica a 45 giorni).</div>`;
    return;
  }

  let timeline = [];
  if (timelineEncoded) {
    try {
      timeline = JSON.parse(decodeURIComponent(timelineEncoded));
    } catch (_) {
      timeline = [];
    }
  }

  const audioSectionHtml = signedAudioUrl ? `
    <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: rgba(56, 189, 248, 0.10); border: 1px solid rgba(56, 189, 248, 0.35);">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8;">Commento audio del Coach</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span id="syncTimerLabel_${feedbackId}" style="font-size: 0.72rem; color: var(--text-muted);">0:00</span>
          <button type="button" id="btnSyncPlay_${feedbackId}" class="btn btn-primary btn-sm" style="width: auto; padding: 4px 12px; font-size: 0.74rem;">
            ▶️ Ascolta con video
          </button>
        </div>
      </div>
      <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.12); border-radius: 99px; margin-top: 7px; overflow: hidden;">
        <div id="syncProgressBar_${feedbackId}" style="width: 0%; height: 100%; background: #38bdf8; transition: width 0.1s linear;"></div>
      </div>
    </div>
  ` : "";

  box.innerHTML = `
    <video id="exerciseFeedbackVideo_${feedbackId}" controls playsinline webkit-playsinline preload="metadata" style="width: 100%; max-height: 340px; border-radius: 8px; background: #000; margin-top: 6px;">
      <source src="${signedVideoUrl}">
      Il tuo browser non supporta la riproduzione video.
    </video>
    ${audioSectionHtml}
  `;

  if (!signedAudioUrl) return;

  const videoEl = document.getElementById(`exerciseFeedbackVideo_${feedbackId}`);
  const syncBtn = document.getElementById(`btnSyncPlay_${feedbackId}`);
  const timerLabel = document.getElementById(`syncTimerLabel_${feedbackId}`);
  const progressBar = document.getElementById(`syncProgressBar_${feedbackId}`);

  // Stato riproduzione Web Audio API (indipendente dal <video> su Safari iOS)
  let audioCtx = null;
  let audioBuffer = null;
  let sourceNode = null;
  let isPlaying = false;
  let startedAtCtxTime = 0;
  let pausedOffsetSec = 0;
  let rafId = null;

  const stopPlayback = (resetToStart = false) => {
    isPlaying = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (sourceNode) {
      try { sourceNode.onended = null; sourceNode.stop(); } catch (_) {}
      sourceNode = null;
    }
    if (videoEl) {
      videoEl.pause();
      videoEl.controls = true;
    }
    if (resetToStart) {
      pausedOffsetSec = 0;
      if (progressBar) progressBar.style.width = "0%";
      if (timerLabel && audioBuffer) {
        timerLabel.textContent = `0:00 / ${formatSecondsMmSs(Math.round(audioBuffer.duration))}`;
      }
    }
    if (syncBtn) syncBtn.textContent = "▶️ Ascolta con video";
  };

  box._stopSyncPlayback = () => {
    stopPlayback(true);
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  };

  const applyTimelineAt = (t) => {
    if (!videoEl || !timeline || timeline.length === 0) return;

    let activeEvt = timeline[0];
    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].t <= t) {
        activeEvt = timeline[i];
      } else {
        break;
      }
    }
    if (!activeEvt) return;

    if (activeEvt.paused) {
      if (!videoEl.paused) videoEl.pause();
      if (Math.abs(videoEl.currentTime - activeEvt.videoTime) > 0.25) {
        videoEl.currentTime = activeEvt.videoTime;
      }
    } else {
      const expectedVideoTime = activeEvt.videoTime + Math.max(0, t - activeEvt.t);
      if (Math.abs(videoEl.currentTime - expectedVideoTime) > 0.45) {
        videoEl.currentTime = Math.min(expectedVideoTime, videoEl.duration || expectedVideoTime);
      }
      if (videoEl.paused && expectedVideoTime < (videoEl.duration || 999)) {
        videoEl.play().catch(() => {});
      }
    }
  };

  const tick = () => {
    if (!isPlaying || !audioCtx || !audioBuffer) return;
    const elapsed = pausedOffsetSec + (audioCtx.currentTime - startedAtCtxTime);
    const total = audioBuffer.duration || 1;

    if (elapsed >= total) {
      stopPlayback(true);
      return;
    }

    if (timerLabel) {
      timerLabel.textContent = `${formatSecondsMmSs(Math.floor(elapsed))} / ${formatSecondsMmSs(Math.round(total))}`;
    }
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
    }

    applyTimelineAt(elapsed);
    rafId = requestAnimationFrame(tick);
  };

  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      if (isPlaying) {
        pausedOffsetSec += audioCtx.currentTime - startedAtCtxTime;
        stopPlayback(false);
        syncBtn.textContent = "▶️ Riprendi";
        return;
      }

      try {
        syncBtn.disabled = true;
        syncBtn.textContent = "⏳ Caricamento...";

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        if (!audioBuffer) {
          const resp = await fetch(signedAudioUrl);
          const arrayBuf = await resp.arrayBuffer();
          audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        }

        videoEl.muted = true;
        videoEl.controls = false;
        if (pausedOffsetSec === 0) {
          videoEl.currentTime = timeline.length > 0 ? timeline[0].videoTime : 0;
        }

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioCtx.destination);
        sourceNode.onended = () => {
          if (isPlaying) stopPlayback(true);
        };

        startedAtCtxTime = audioCtx.currentTime;
        isPlaying = true;
        sourceNode.start(0, pausedOffsetSec);

        syncBtn.disabled = false;
        syncBtn.textContent = "⏸️ Pausa";
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        console.error("Errore riproduzione audio sync:", err);
        syncBtn.disabled = false;
        syncBtn.textContent = "▶️ Ascolta con video";
        alert("Impossibile avviare l'audio: " + err.message);
      }
    });
  }
};

// ============================================================
// REGISTRAZIONE VOCALE DEL COACH SOPRA IL VIDEO (MAX 2 MINUTI)
// ============================================================

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

window.toggleCoachAudioRecording = async function(feedbackId, videoPath) {
  const btnRec = document.getElementById(`btnRecordCoachAudio_${feedbackId}`);
  const statusEl = document.getElementById(`coachAudioRecStatus_${feedbackId}`);
  const previewWrap = document.getElementById(`coachAudioPreviewWrap_${feedbackId}`);

  // Se sta già registrando -> FERMA la registrazione
  if (activeCoachAudioRecorders.has(feedbackId)) {
    const state = activeCoachAudioRecorders.get(feedbackId);
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.recorder && state.recorder.state !== "inactive") {
      state.recorder.stop();
    }
    return;
  }

  // Apri il video se non è già aperto, così il coach può metterlo in pausa mentre parla
  const playerBox = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (playerBox && (playerBox.classList.contains("hidden") || !playerBox.querySelector("video"))) {
    await window.playExerciseVideoFeedback(feedbackId, videoPath);
  }

  const videoEl = document.getElementById(`exerciseFeedbackVideo_${feedbackId}`);
  if (!videoEl) {
    alert("Impossibile aprire il player video per la registrazione.");
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Il tuo browser non supporta la registrazione microfono.");
    return;
  }

  try {
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedAudioMimeType();
    const recorder = mimeType
      ? new MediaRecorder(micStream, { mimeType, audioBitsPerSecond: 64000 })
      : new MediaRecorder(micStream);

    const chunks = [];
    const timeline = [];
    const startTimeMs = Date.now();

    const recordEvent = () => {
      const elapsedSec = Math.round(((Date.now() - startTimeMs) / 1000) * 100) / 100;
      timeline.push({
        t: elapsedSec,
        videoTime: Math.round((videoEl.currentTime || 0) * 100) / 100,
        paused: Boolean(videoEl.paused)
      });
    };

    recordEvent();
    const onVideoEvent = () => recordEvent();
    videoEl.addEventListener("play", onVideoEvent);
    videoEl.addEventListener("pause", onVideoEvent);
    videoEl.addEventListener("seeked", onVideoEvent);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      videoEl.removeEventListener("play", onVideoEvent);
      videoEl.removeEventListener("pause", onVideoEvent);
      videoEl.removeEventListener("seeked", onVideoEvent);
      micStream.getTracks().forEach((tr) => tr.stop());

      const currentState = activeCoachAudioRecorders.get(feedbackId);
      if (currentState && currentState.timerInterval) clearInterval(currentState.timerInterval);

      const finalMime = (recorder.mimeType || mimeType || "audio/mp4").split(";")[0];
      const audioBlob = new Blob(chunks, { type: finalMime });
      const audioPreviewUrl = URL.createObjectURL(audioBlob);

      activeCoachAudioRecorders.set(feedbackId, {
        recordedBlob: audioBlob,
        mimeType: finalMime,
        timeline
      });

      if (btnRec) {
        btnRec.textContent = "Registra di nuovo";
        btnRec.style.background = "";
        btnRec.style.color = "";
      }
      if (statusEl) {
        statusEl.textContent = `Audio pronto. Clicca "Salva" per inviarlo.`;
      }
      if (previewWrap) {
        previewWrap.classList.remove("hidden");
        previewWrap.innerHTML = `
          <div style="margin-top: 6px; padding: 6px; border-radius: 6px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:0.72rem; font-weight:700; color:#10b981;">Anteprima commento audio:</span>
              <button type="button" class="btn btn-outline btn-sm" style="padding:1px 6px; font-size:0.68rem; width:auto; border-color:var(--danger); color:var(--danger);" onclick="discardCoachRecordedAudio('${feedbackId}')">Scarta</button>
            </div>
            <audio controls playsinline src="${audioPreviewUrl}" style="width: 100%; height: 32px;"></audio>
          </div>
        `;
      }
    };

    // Avvia registrazione (limite massimo 2 minuti = 120s)
    recorder.start(250);
    videoEl.muted = true;
    videoEl.play().catch(() => {});

    let sec = 0;
    const maxFormatted = formatSecondsMmSs(MAX_COACH_AUDIO_DURATION_SEC);
    if (btnRec) {
      btnRec.textContent = `Stop (0:00 / ${maxFormatted})`;
      btnRec.style.background = "#ef4444";
      btnRec.style.color = "#fff";
    }
    if (statusEl) {
      statusEl.textContent = "Registrazione in corso: commenta e metti in pausa il video nei punti chiave (max 2 min).";
    }

    const timerInterval = setInterval(() => {
      sec++;
      if (btnRec) btnRec.textContent = `Stop (${formatSecondsMmSs(sec)} / ${maxFormatted})`;
      if (sec >= MAX_COACH_AUDIO_DURATION_SEC && recorder.state !== "inactive") {
        recorder.stop();
      }
    }, 1000);

    activeCoachAudioRecorders.set(feedbackId, {
      recorder,
      timerInterval
    });
  } catch (err) {
    console.error(err);
    alert("Permesso microfono negato o non disponibile: " + err.message);
  }
};

window.discardCoachRecordedAudio = function(feedbackId) {
  activeCoachAudioRecorders.delete(feedbackId);
  const previewWrap = document.getElementById(`coachAudioPreviewWrap_${feedbackId}`);
  const statusEl = document.getElementById(`coachAudioRecStatus_${feedbackId}`);
  const btnRec = document.getElementById(`btnRecordCoachAudio_${feedbackId}`);
  if (previewWrap) {
    previewWrap.classList.add("hidden");
    previewWrap.innerHTML = "";
  }
  if (statusEl) statusEl.textContent = "";
  if (btnRec) btnRec.textContent = "Registra commento audio";
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

    let { error: uploadErr } = await supabaseClient.storage
      .from(VIDEO_STORAGE_BUCKET)
      .upload(storagePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileToUpload.type || "video/mp4"
      });

    if (uploadErr && String(uploadErr.message || "").includes("Load failed")) {
      await supabaseClient.auth.getSession();
      const retryUpload = await supabaseClient.storage
        .from(VIDEO_STORAGE_BUCKET)
        .upload(storagePath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
          contentType: fileToUpload.type || "video/mp4"
        });
      uploadErr = retryUpload.error;
    }

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

// Eliminazione video (e eventuale audio coach) da parte dell'atleta
window.deleteAthleteExerciseVideo = async function(feedbackId, videoPath, audioPath = "") {
  if (!confirm("Vuoi eliminare questo video?")) return;

  const pathsToDelete = [videoPath, audioPath].filter(Boolean);
  if (pathsToDelete.length > 0) {
    await supabaseClient.storage.from(VIDEO_STORAGE_BUCKET).remove(pathsToDelete);
  }

  let { error } = await supabaseClient
    .from("exercise_video_feedbacks")
    .delete()
    .eq("id", feedbackId)
    .eq("athlete_id", currentProfile.id);

  if (error && String(error.message || "").includes("Load failed")) {
    await supabaseClient.auth.getSession();
    const retry = await supabaseClient
      .from("exercise_video_feedbacks")
      .delete()
      .eq("id", feedbackId)
      .eq("athlete_id", currentProfile.id);
    error = retry.error;
  }

  if (error) {
    alert("Errore eliminazione video: " + error.message);
    return;
  }

  if (typeof loadAthleteWorkout === "function") {
    await loadAthleteWorkout();
  }
};

// Salvataggio Nota Tecnica e/o Audio Vocale del Coach sul video
window.saveCoachVideoFeedback = async function(feedbackId, clientId, clientName, selectedWorkoutId) {
  const textarea = document.getElementById(`coachVideoNoteInput_${feedbackId}`);
  const feedbackText = textarea ? textarea.value.trim() : "";
  const recState = activeCoachAudioRecorders.get(feedbackId);
  const hasNewRecordedAudio = Boolean(recState && recState.recordedBlob);

  if (!feedbackText && !hasNewRecordedAudio) {
    alert("Scrivi una nota tecnica oppure registra un commento audio prima di salvare.");
    return;
  }

  const saveBtn = document.getElementById(`btnSaveCoachVideo_${feedbackId}`);
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "⏳...";
  }

  try {
    let uploadedAudioPath = null;
    let uploadedTimeline = null;

    if (hasNewRecordedAudio) {
      const ext = recState.mimeType.includes("webm") ? "webm" : recState.mimeType.includes("ogg") ? "ogg" : "m4a";
      const audioStoragePath = `${currentProfile.id}/${clientId}/audio_${feedbackId}_${Date.now()}.${ext}`;

      let { error: audioUpErr } = await supabaseClient.storage
        .from(VIDEO_STORAGE_BUCKET)
        .upload(audioStoragePath, recState.recordedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: recState.mimeType
        });

      if (audioUpErr && String(audioUpErr.message || "").includes("Load failed")) {
        await supabaseClient.auth.getSession();
        const retryUp = await supabaseClient.storage
          .from(VIDEO_STORAGE_BUCKET)
          .upload(audioStoragePath, recState.recordedBlob, {
            cacheControl: "3600",
            upsert: false,
            contentType: recState.mimeType
          });
        audioUpErr = retryUp.error;
      }

      if (audioUpErr) {
        throw new Error("Errore caricamento audio: " + audioUpErr.message);
      }

      uploadedAudioPath = audioStoragePath;
      uploadedTimeline = recState.timeline || [];
    }

    const payload = {
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      athlete_seen_at: null
    };

    if (feedbackText) {
      payload.coach_feedback = feedbackText;
    } else if (uploadedAudioPath) {
      payload.coach_feedback = "Ascolta il commento sul video";
    }

    if (uploadedAudioPath) {
      payload.coach_audio_path = uploadedAudioPath;
      payload.coach_audio_timeline = uploadedTimeline;
    }

    let { error } = await supabaseClient
      .from("exercise_video_feedbacks")
      .update(payload)
      .eq("id", feedbackId)
      .eq("coach_id", currentProfile.id);

    if (error && String(error.message || "").includes("Load failed")) {
      await supabaseClient.auth.getSession();
      const retry = await supabaseClient
        .from("exercise_video_feedbacks")
        .update(payload)
        .eq("id", feedbackId)
        .eq("coach_id", currentProfile.id);
      error = retry.error;
    }

    if (error) {
      throw new Error("Errore salvataggio nota tecnica: " + error.message);
    }

    activeCoachAudioRecorders.delete(feedbackId);
    alert("✅ Feedback inviato all'atleta!");

    if (typeof viewClientProgress === "function") {
      await viewClientProgress(clientId, clientName, selectedWorkoutId);
    }
    if (typeof loadTrainerClients === "function") {
      loadTrainerClients();
    }
  } catch (err) {
    alert(err.message || "Errore durante il salvataggio.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Salva";
    }
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
    const hasAudio = Boolean(vf.coach_audio_path);
    const hasText = Boolean(vf.coach_feedback && vf.coach_feedback !== "Ascolta il commento sul video");
    const isReviewed = vf.status === "reviewed" && (hasAudio || Boolean(vf.coach_feedback));
    const timelineEncoded = vf.coach_audio_timeline ? encodeURIComponent(JSON.stringify(vf.coach_audio_timeline)) : "";

    const statusBadge = isReviewed
      ? `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`
      : `<span style="font-size:0.68rem; background:rgba(245,158,11,0.18); color:#f59e0b; padding:1px 6px; border-radius:4px; font-weight:700;">⏳ In attesa del Coach</span>`;

    const coachMessageHtml = isReviewed
      ? `<div class="note-coach-box" style="margin-top: 6px; white-space: pre-wrap; text-align: left;"><strong>Nota Tecnica ${escapeHtml(coachFirstName)}:</strong>${hasAudio ? `\nAscolta il commento sul video` : ""}${hasText ? `\n${escapeHtml(vf.coach_feedback)}` : ""}</div>`
      : "";

    return `
      <div style="background: var(--subcard-bg); border: 1px solid var(--border); border-radius: 7px; padding: 8px; margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 0.74rem; color: var(--text-muted);">🎥 Clip del ${dateStr} ${statusBadge}</span>
          <div style="display: flex; gap: 5px;">
            ${vf.video_path ? `<button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}', '${escapeHtml(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda</button>` : `<span style="font-size:0.7rem; color:var(--text-muted);">File archiviato</span>`}
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.72rem; width: auto; border-color: var(--danger); color: var(--danger);" onclick="deleteAthleteExerciseVideo('${vf.id}', '${escapeHtml(vf.video_path || "")}', '${escapeHtml(vf.coach_audio_path || "")}')">🗑️</button>
          </div>
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.76rem; margin-top: 4px; color: var(--text);"><strong>La tua nota:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>
        ${coachMessageHtml}
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
    <details style="margin-top: 8px; border-top: 1px dashed var(--border); padding-top: 6px;" ${list.some(v => (v.coach_feedback || v.coach_audio_path) && !v.athlete_seen_at) ? "open" : ""}>
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
    const hasAudio = Boolean(vf.coach_audio_path);
    const timelineEncoded = vf.coach_audio_timeline ? encodeURIComponent(JSON.stringify(vf.coach_audio_timeline)) : "";
    const existingText = vf.coach_feedback === "Ascolta il commento sul video" ? "" : (vf.coach_feedback || "");

    const badge = isPending
      ? `<span style="font-size:0.68rem; background:rgba(239,68,68,0.18); color:#ef4444; padding:1px 6px; border-radius:4px; font-weight:700;">● DA REVISIONARE</span>`
      : `<span style="font-size:0.68rem; background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:4px; font-weight:700;">✅ Revisionato</span>`;

    return `
      <div style="background: var(--subcard-bg); border: 1.5px solid ${isPending ? "#ef4444" : "var(--border)"}; border-radius: 8px; padding: 9px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          <strong style="font-size: 0.78rem;">🎥 Video Esecuzione (${dateStr}) ${badge}</strong>
          ${vf.video_path
            ? `<button type="button" class="btn btn-primary btn-sm" style="padding: 3px 9px; font-size: 0.74rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeHtml(vf.video_path)}', '${escapeHtml(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda Video</button>`
            : `<span style="font-size: 0.72rem; color: var(--text-muted);">Video rimosso (>45 gg)</span>`}
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.78rem; margin-top: 5px; color: var(--text);"><strong>Domanda Atleta:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>

        <!-- Sezione Registrazione Vocale Sincronizzata del Coach (max 2 min) -->
        <div style="margin-top: 8px; padding-top: 7px; border-top: 1px dashed var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" id="btnRecordCoachAudio_${vf.id}" class="btn btn-outline btn-sm" style="width: auto; font-size: 0.74rem;" onclick="toggleCoachAudioRecording('${vf.id}', '${escapeHtml(vf.video_path || "")}')">
              ${hasAudio ? "Registra nuovo audio" : "Registra commento audio"}
            </button>
            ${hasAudio ? `<span style="font-size: 0.7rem; color: #10b981; font-weight: 700;">Audio salvato</span>` : `<span style="font-size: 0.7rem; color: var(--text-muted);">Max 2 min</span>`}
          </div>
          <div id="coachAudioRecStatus_${vf.id}" style="font-size: 0.72rem; color: var(--primary); margin-top: 4px;"></div>
          <div id="coachAudioPreviewWrap_${vf.id}" class="hidden"></div>
        </div>

        <div style="margin-top: 7px;">
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 3px;">Nota Tecnica Scritta (opzionale se registri audio):</label>
          <div style="display: flex; gap: 6px; align-items: flex-end;">
            <textarea id="coachVideoNoteInput_${vf.id}" rows="2" placeholder="Scrivi correzione tecnica o aggiungi dettagli all'audio..." style="flex: 1; min-height: 46px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;">${escapeHtml(existingText)}</textarea>
            <button type="button" id="btnSaveCoachVideo_${vf.id}" class="btn btn-success btn-sm" style="width: auto; align-self: stretch;" onclick="saveCoachVideoFeedback('${vf.id}', '${clientId}', '${escapeHtml(clientName).replace(/'/g, "\\'")}', '${workoutId}')">💾 Salva</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `<div style="margin-top: 6px;">${cardsHtml}</div>`;
}
