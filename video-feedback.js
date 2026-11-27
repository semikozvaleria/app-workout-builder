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
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
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

// Restituisce i secondi dell'audio in cui il coach ha messo in pausa il video
// (solo transizioni play -> pausa, così il trascinamento non crea marker multipli)
function getTimelinePauseMarkers(timeline) {
  const out = [];
  if (!Array.isArray(timeline)) return out;
  let prevPaused = false;
  timeline.forEach((evt, i) => {
    if (!evt) return;
    if (evt.paused && (i === 0 ? false : !prevPaused) && evt.t > 0.3) out.push(evt.t);
    prevPaused = Boolean(evt.paused);
  });
  return out;
}

// Restituisce true se all'istante t della timeline il video era in pausa
function isTimelinePausedAt(timeline, t) {
  if (!Array.isArray(timeline) || timeline.length === 0) return false;
  let active = timeline[0];
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].t <= t) active = timeline[i];
    else break;
  }
  return Boolean(active && active.paused);
}

// Helper condiviso per applicare la timeline al controller video
function applyTimelineToController(controller, timeline, t) {
  if (!controller || !timeline || timeline.length === 0) return;

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
    if (!controller.paused) controller.pauseSilent();
    if (Math.abs(controller.currentTime - activeEvt.videoTime) > 0.15) {
      controller.seekSilent(activeEvt.videoTime);
    }
  } else {
    const expectedVideoTime = activeEvt.videoTime + Math.max(0, t - activeEvt.t);
    const maxDur = controller.duration || 999;
    if (expectedVideoTime >= maxDur) {
      if (!controller.paused) controller.pauseSilent();
      controller.seekSilent(maxDur);
      return;
    }
    if (Math.abs(controller.currentTime - expectedVideoTime) > 0.35) {
      controller.seekSilent(expectedVideoTime);
    }
    if (controller.paused) {
      controller.playNative();
    }
  }
}

// ============================================================
// PLAYER VIDEO SU CANVAS (FLUIDO NATIVO + MODALITÀ MIC-SAFE SU IOS)
// ============================================================

window.playExerciseVideoFeedback = async function(feedbackId, videoPath, audioPath = "", timelineEncoded = "") {
  const box = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (!box) return;

  if (!box.classList.contains("hidden") && box._playerController) {
    box.classList.add("hidden");
    box._playerController.destroy();
    box._playerController = null;
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

  // Scarica il video in Blob locale per eliminare lag durante seek e registrazione
  let localBlobUrl = null;
  try {
    const vidResp = await fetch(signedVideoUrl);
    if (vidResp.ok) {
      const vidBlob = await vidResp.blob();
      localBlobUrl = URL.createObjectURL(vidBlob);
    }
  } catch (_) {
    localBlobUrl = null;
  }

  let timeline = [];
  if (timelineEncoded) {
    try {
      timeline = JSON.parse(decodeURIComponent(timelineEncoded));
    } catch (_) {
      timeline = [];
    }
  }

  // Punti in cui il coach ha messo in pausa il video (marker sulla barra audio)
  const pauseMarkerTimes = getTimelinePauseMarkers(timeline);

  const audioSectionHtml = signedAudioUrl ? `
    <div style="margin-top: 8px; padding: 8px; border-radius: 8px; background: rgba(56, 189, 248, 0.10); border: 1px solid rgba(56, 189, 248, 0.35);">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">🎙️ Commento audio del Coach</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span id="syncTimerLabel_${feedbackId}" style="font-size: 0.72rem; color: var(--text-muted); font-variant-numeric: tabular-nums;">0:00</span>
          <button type="button" id="btnSyncPlay_${feedbackId}" class="btn btn-primary btn-sm" style="width: auto; padding: 4px 12px; font-size: 0.74rem;">
            ▶️ Ascolta con video
          </button>
        </div>
      </div>
      <div id="syncTrack_${feedbackId}" class="vf-audio-track" title="Tocca per spostarti nel commento">
        <div class="vf-audio-track-bg"><div id="syncProgressBar_${feedbackId}" class="vf-audio-track-fill"></div></div>
        <div id="syncMarkers_${feedbackId}"></div>
      </div>
      ${pauseMarkerTimes.length > 0 ? `<div class="vf-legend"><i></i>Punti in cui il coach ferma il video per spiegare · tocca la barra per riascoltare</div>` : `<div class="vf-legend">Tocca la barra per spostarti nel commento</div>`}
    </div>
  ` : "";

  box.innerHTML = `
    <div style="margin-top: 6px; background: #000; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
      <div class="vf-stage">
        <canvas id="videoCanvas_${feedbackId}" style="width: 100%; max-height: 330px; display: block; object-fit: contain; background: #000; cursor: pointer;"></canvas>
        <div class="vf-overlay">
          <span id="vfRecChip_${feedbackId}" class="vf-chip rec hidden"><span class="vf-rec-dot"></span><span id="vfRecChipText_${feedbackId}">REC 0:00</span></span>
          <span id="vfPauseChip_${feedbackId}" class="vf-chip coach-pause hidden">⏸ Pausa del coach</span>
        </div>
        <div id="vfHint_${feedbackId}" class="vf-hint hidden"></div>
      </div>
      <div id="vfControls_${feedbackId}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(15, 23, 42, 0.95); border-top: 1px solid rgba(255,255,255,0.1);">
        <button type="button" id="btnCanvasPlayPause_${feedbackId}" class="btn btn-outline btn-sm" style="width: auto; padding: 3px 10px; font-size: 0.74rem; min-width: 72px;">
          ▶️ Play
        </button>
        <input type="range" id="canvasScrubber_${feedbackId}" min="0" max="100" step="0.03" value="0" style="flex: 1; accent-color: var(--primary); cursor: pointer;">
        <span id="canvasVideoTime_${feedbackId}" style="font-size: 0.7rem; color: #cbd5e1; font-variant-numeric: tabular-nums; min-width: 64px; text-align: right;">0:00 / 0:00</span>
      </div>
    </div>
    ${audioSectionHtml}
  `;

  const canvas = document.getElementById(`videoCanvas_${feedbackId}`);
  const ctx = canvas.getContext("2d");
  const btnPlayPause = document.getElementById(`btnCanvasPlayPause_${feedbackId}`);
  const scrubber = document.getElementById(`canvasScrubber_${feedbackId}`);
  const timeLabel = document.getElementById(`canvasVideoTime_${feedbackId}`);

  const hiddenVideo = document.createElement("video");
  hiddenVideo.crossOrigin = "anonymous";
  hiddenVideo.muted = true;
  hiddenVideo.defaultMuted = true;
  hiddenVideo.playsInline = true;
  hiddenVideo.setAttribute("playsinline", "");
  hiddenVideo.setAttribute("webkit-playsinline", "");
  hiddenVideo.preload = "auto";
  hiddenVideo.src = localBlobUrl || signedVideoUrl;

  let isPlaying = false;
  let useMicSafeMode = false; // Attivo solo mentre il microfono del coach sta registrando
  let nativeRafId = null;
  let micStepInterval = null;
  let lastStepWallMs = 0;
  const listeners = [];

  const emitVideoStateChange = () => {
    listeners.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
  };

  const drawCurrentFrame = () => {
    if (hiddenVideo.videoWidth && hiddenVideo.videoHeight) {
      if (canvas.width !== hiddenVideo.videoWidth || canvas.height !== hiddenVideo.videoHeight) {
        canvas.width = hiddenVideo.videoWidth;
        canvas.height = hiddenVideo.videoHeight;
      }
      try {
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
      } catch (_) {}
    }
    const dur = hiddenVideo.duration || 0;
    const cur = hiddenVideo.currentTime || 0;
    if (dur > 0 && !scrubber._isDragging) {
      scrubber.max = dur;
      scrubber.value = cur;
    }
    timeLabel.textContent = `${formatSecondsMmSs(cur)} / ${formatSecondsMmSs(dur)}`;
  };

  const stopLoops = () => {
    if (nativeRafId) {
      cancelAnimationFrame(nativeRafId);
      nativeRafId = null;
    }
    if (micStepInterval) {
      clearInterval(micStepInterval);
      micStepInterval = null;
    }
  };

  const pauseVideo = (silent = false) => {
    stopLoops();
    if (!hiddenVideo.paused) {
      hiddenVideo.pause();
    }
    isPlaying = false;
    btnPlayPause.textContent = "▶️ Play";
    drawCurrentFrame();
    if (!silent) emitVideoStateChange();
  };

  // Riproduzione fluida nativa (usata fuori dalla registrazione microfono)
  const playNative = () => {
    if (isPlaying && !useMicSafeMode) return;
    stopLoops();
    const dur = hiddenVideo.duration || 0;
    if (dur > 0 && hiddenVideo.currentTime >= dur - 0.05) {
      hiddenVideo.currentTime = 0;
    }
    hiddenVideo.muted = true;
    isPlaying = true;
    btnPlayPause.textContent = "⏸️ Pausa";
    emitVideoStateChange();

    hiddenVideo.play().then(() => {
      const renderLoop = () => {
        if (!isPlaying || hiddenVideo.paused || hiddenVideo.ended) {
          if (hiddenVideo.ended) {
            pauseVideo(false);
          }
          return;
        }
        drawCurrentFrame();
        nativeRafId = requestAnimationFrame(renderLoop);
      };
      nativeRafId = requestAnimationFrame(renderLoop);
    }).catch(() => {
      playMicSafe();
    });
  };

  // Riproduzione senza .play() di sistema (usata SOLO mentre il microfono registra su iOS)
  const playMicSafe = () => {
    if (isPlaying) return;
    stopLoops();
    const dur = hiddenVideo.duration || 0;
    if (dur > 0 && hiddenVideo.currentTime >= dur - 0.05) {
      hiddenVideo.currentTime = 0;
    }
    isPlaying = true;
    btnPlayPause.textContent = "⏸️ Pausa";
    lastStepWallMs = performance.now();
    emitVideoStateChange();

    micStepInterval = setInterval(() => {
      if (!isPlaying) return;
      const now = performance.now();
      const dt = (now - lastStepWallMs) / 1000;
      lastStepWallMs = now;

      const totalDur = hiddenVideo.duration || 0;
      const nextTime = (hiddenVideo.currentTime || 0) + dt;

      if (totalDur > 0 && nextTime >= totalDur) {
        hiddenVideo.currentTime = totalDur;
        pauseVideo(false);
      } else if (!hiddenVideo.seeking) {
        hiddenVideo.currentTime = nextTime;
      }
    }, 33); // ~30 fps su Blob locale in RAM -> zero lag
  };

  const playVideo = () => {
    if (useMicSafeMode) playMicSafe();
    else playNative();
  };

  const seekVideo = (sec, silent = false) => {
    const dur = hiddenVideo.duration || 0;
    const target = Math.max(0, Math.min(sec, dur || sec));
    hiddenVideo.currentTime = target;
    if (!silent) emitVideoStateChange();
  };

  hiddenVideo.addEventListener("loadeddata", () => {
    hiddenVideo.currentTime = 0.01;
    drawCurrentFrame();
  });

  hiddenVideo.addEventListener("seeked", () => {
    drawCurrentFrame();
  });

  // Se è attiva la riproduzione sincronizzata del commento audio, play/pausa
  // agiscono sul commento (audio + video insieme) invece che sul solo video.
  let userToggleOverride = null;
  const handleUserToggle = () => {
    if (userToggleOverride) {
      userToggleOverride();
      return;
    }
    if (isPlaying) pauseVideo(false);
    else playVideo();
  };

  btnPlayPause.addEventListener("click", handleUserToggle);
  canvas.addEventListener("click", handleUserToggle);

  scrubber.addEventListener("input", () => {
    scrubber._isDragging = true;
    seekVideo(parseFloat(scrubber.value), false);
  });
  scrubber.addEventListener("change", () => {
    scrubber._isDragging = false;
    seekVideo(parseFloat(scrubber.value), false);
  });

  const recChip = document.getElementById(`vfRecChip_${feedbackId}`);
  const recChipText = document.getElementById(`vfRecChipText_${feedbackId}`);
  const pauseChip = document.getElementById(`vfPauseChip_${feedbackId}`);
  const hintEl = document.getElementById(`vfHint_${feedbackId}`);

  const controller = {
    // Overlay "● REC m:ss" durante la registrazione del coach (null = nascosto)
    setRecordingOverlay(text) {
      if (!recChip) return;
      if (text) {
        recChipText.textContent = text;
        recChip.classList.remove("hidden");
      } else {
        recChip.classList.add("hidden");
      }
    },
    setHint(text) {
      if (!hintEl) return;
      hintEl.textContent = text || "";
      hintEl.classList.toggle("hidden", !text);
    },
    setCoachPauseOverlay(visible) {
      if (pauseChip) pauseChip.classList.toggle("hidden", !visible);
    },
    // Blocca la barra del video mentre il commento sincronizzato la guida
    setScrubberLocked(locked) {
      scrubber.classList.toggle("vf-scrubber-locked", Boolean(locked));
    },
    setUserToggleOverride(fn) { userToggleOverride = fn || null; },
    get currentTime() { return hiddenVideo.currentTime || 0; },
    get duration() { return hiddenVideo.duration || 0; },
    get paused() { return !isPlaying; },
    setMicSafeMode(enabled) { useMicSafeMode = Boolean(enabled); },
    play: playVideo,
    playNative,
    pause: () => pauseVideo(false),
    pauseSilent: () => pauseVideo(true),
    seek: (sec) => seekVideo(sec, false),
    seekSilent: (sec) => seekVideo(sec, true),
    onStateChange(fn) { listeners.push(fn); },
    offStateChange(fn) {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    },
    stopAudioSync: null,
    destroy() {
      if (this.stopAudioSync) this.stopAudioSync();
      pauseVideo(true);
      hiddenVideo.src = "";
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
        localBlobUrl = null;
      }
    }
  };

  box._playerController = controller;

  // ============================================================
  // RIPRODUZIONE SINCRONIZZATA CON WEB AUDIO API (LATO ATLETA E COACH)
  // ============================================================
  if (!signedAudioUrl) return;

  const syncBtn = document.getElementById(`btnSyncPlay_${feedbackId}`);
  const timerLabel = document.getElementById(`syncTimerLabel_${feedbackId}`);
  const progressBar = document.getElementById(`syncProgressBar_${feedbackId}`);
  const syncTrack = document.getElementById(`syncTrack_${feedbackId}`);
  const markersWrap = document.getElementById(`syncMarkers_${feedbackId}`);

  let audioCtx = null;
  let audioBuffer = null;
  let audioLoadPromise = null;
  let sourceNode = null;
  let isAudioPlaying = false;
  let startedAtCtxTime = 0;
  let pausedOffsetSec = 0;
  let audioRafId = null;

  const getAudioTotal = () => (audioBuffer ? audioBuffer.duration : 0) || 0;

  const updateAudioUi = (elapsed) => {
    const total = getAudioTotal();
    if (timerLabel) {
      timerLabel.textContent = `${formatSecondsMmSs(Math.floor(elapsed))} / ${formatSecondsMmSs(Math.round(total))}`;
    }
    if (progressBar && total > 0) {
      progressBar.style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
    }
    controller.setCoachPauseOverlay(isAudioPlaying && isTimelinePausedAt(timeline, elapsed));
  };

  const renderMarkers = () => {
    const total = getAudioTotal();
    if (!markersWrap || total <= 0) return;
    markersWrap.innerHTML = pauseMarkerTimes
      .filter((t) => t < total)
      .map((t) => `<span class="vf-audio-marker" style="left: ${((t / total) * 100).toFixed(2)}%;"></span>`)
      .join("");
  };

  // Carica e decodifica l'audio una sola volta (anche in anticipo, per i marker)
  const ensureAudioLoaded = () => {
    if (audioLoadPromise) return audioLoadPromise;
    audioLoadPromise = (async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AudioContextClass();
      const resp = await fetch(signedAudioUrl);
      const arrayBuf = await resp.arrayBuffer();
      audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      renderMarkers();
      updateAudioUi(pausedOffsetSec);
      return audioBuffer;
    })();
    audioLoadPromise.catch(() => { audioLoadPromise = null; });
    return audioLoadPromise;
  };

  // Posizione del video prevista dalla timeline all'istante t (senza avviarlo)
  const getTimelineVideoTimeAt = (t) => {
    if (!timeline.length) return 0;
    let evt = timeline[0];
    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].t <= t) evt = timeline[i];
      else break;
    }
    const vt = evt.paused ? evt.videoTime : evt.videoTime + Math.max(0, t - evt.t);
    const dur = controller.duration || vt;
    return Math.max(0, Math.min(vt, dur));
  };

  const stopSource = () => {
    if (audioRafId) {
      cancelAnimationFrame(audioRafId);
      audioRafId = null;
    }
    if (sourceNode) {
      try { sourceNode.onended = null; sourceNode.stop(); } catch (_) {}
      sourceNode = null;
    }
  };

  const stopAudioPlayback = (resetToStart = false) => {
    isAudioPlaying = false;
    stopSource();
    pauseVideo(true);
    controller.setUserToggleOverride(null);
    controller.setScrubberLocked(false);
    controller.setCoachPauseOverlay(false);
    if (resetToStart) {
      pausedOffsetSec = 0;
      if (progressBar) progressBar.style.width = "0%";
      if (timerLabel && audioBuffer) {
        timerLabel.textContent = `0:00 / ${formatSecondsMmSs(Math.round(audioBuffer.duration))}`;
      }
    }
    if (syncBtn) syncBtn.textContent = resetToStart || pausedOffsetSec === 0 ? "▶️ Ascolta con video" : "▶️ Riprendi";
  };

  controller.stopAudioSync = () => {
    stopAudioPlayback(true);
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    audioBuffer = null;
    audioLoadPromise = null;
  };

  const audioTick = () => {
    if (!isAudioPlaying || !audioCtx || !audioBuffer) return;
    const elapsed = pausedOffsetSec + (audioCtx.currentTime - startedAtCtxTime);
    const total = audioBuffer.duration || 1;

    if (elapsed >= total) {
      stopAudioPlayback(true);
      return;
    }

    updateAudioUi(elapsed);
    applyTimelineToController(controller, timeline, elapsed);
    audioRafId = requestAnimationFrame(audioTick);
  };

  const startSourceAt = (offsetSec) => {
    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioCtx.destination);
    sourceNode.onended = () => {
      if (isAudioPlaying) stopAudioPlayback(true);
    };
    pausedOffsetSec = offsetSec;
    startedAtCtxTime = audioCtx.currentTime;
    sourceNode.start(0, offsetSec);
    audioRafId = requestAnimationFrame(audioTick);
  };

  const pauseAudioSync = () => {
    if (!isAudioPlaying) return;
    const elapsed = pausedOffsetSec + (audioCtx.currentTime - startedAtCtxTime);
    stopAudioPlayback(false);
    pausedOffsetSec = elapsed;
    if (syncBtn) syncBtn.textContent = "▶️ Riprendi";
  };

  const startAudioSync = async () => {
    try {
      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.textContent = "⏳ Caricamento...";
      }
      await ensureAudioLoaded();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      if (pausedOffsetSec === 0) {
        seekVideo(timeline.length > 0 ? timeline[0].videoTime : 0, true);
      }

      isAudioPlaying = true;
      controller.setUserToggleOverride(pauseAudioSync);
      controller.setScrubberLocked(true);
      startSourceAt(pausedOffsetSec);

      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = "⏸️ Pausa";
      }
    } catch (err) {
      console.error("Errore riproduzione audio sync:", err);
      isAudioPlaying = false;
      controller.setUserToggleOverride(null);
      controller.setScrubberLocked(false);
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.textContent = "▶️ Ascolta con video";
      }
      alert("Impossibile avviare l'audio: " + err.message);
    }
  };

  // Tocco sulla barra del commento: salta a quel punto (audio + video allineati)
  const seekAudioTo = (sec) => {
    const total = getAudioTotal();
    if (total <= 0) return;
    const target = Math.max(0, Math.min(sec, total - 0.05));
    if (isAudioPlaying) {
      stopSource();
      startSourceAt(target);
      applyTimelineToController(controller, timeline, target);
    } else {
      pausedOffsetSec = target;
      seekVideo(getTimelineVideoTimeAt(target), true);
      if (syncBtn) syncBtn.textContent = target > 0 ? "▶️ Riprendi" : "▶️ Ascolta con video";
    }
    updateAudioUi(target);
  };

  if (syncTrack) {
    syncTrack.addEventListener("click", async (e) => {
      const rect = syncTrack.getBoundingClientRect();
      const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
      try {
        await ensureAudioLoaded();
      } catch (_) {
        return;
      }
      seekAudioTo(ratio * getAudioTotal());
    });
  }

  controller.pauseAudioSync = pauseAudioSync;

  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      if (isAudioPlaying) pauseAudioSync();
      else startAudioSync();
    });
  }

  // Precarica l'audio in background per mostrare subito durata e marker
  ensureAudioLoaded().catch(() => {});
};

// ============================================================
// ANTEPRIMA SINCRONIZZATA PER IL COACH PRIMA DEL SALVATAGGIO
// ============================================================

window.playCoachDraftPreviewSync = async function(feedbackId) {
  const recState = activeCoachAudioRecorders.get(feedbackId);
  const playerBox = document.getElementById(`videoPlayerBox_${feedbackId}`);
  const controller = playerBox ? playerBox._playerController : null;
  const btn = document.getElementById(`btnCoachDraftPreview_${feedbackId}`);
  const timerEl = document.getElementById(`coachDraftTimer_${feedbackId}`);

  if (!recState || !recState.recordedBlob || !controller) return;

  // Se sta già riproducendo l'anteprima -> stop
  if (recState._previewCtx) {
    if (recState._previewRaf) cancelAnimationFrame(recState._previewRaf);
    try { recState._previewSource.stop(); } catch (_) {}
    recState._previewCtx.close().catch(() => {});
    recState._previewCtx = null;
    controller.pauseSilent();
    controller.setCoachPauseOverlay(false);
    controller.setUserToggleOverride(null);
    controller.setScrubberLocked(false);
    if (btn) btn.textContent = "▶️ Riascolta con video";
    if (timerEl) timerEl.textContent = "0:00";
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳...";
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") await ctx.resume();

    const arrayBuf = await recState.recordedBlob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf);

    const startTime = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    recState._previewCtx = ctx;
    recState._previewSource = source;

    controller.setMicSafeMode(false);
    controller.seekSilent(recState.timeline.length > 0 ? recState.timeline[0].videoTime : 0);

    const stopPreview = () => {
      if (recState._previewRaf) cancelAnimationFrame(recState._previewRaf);
      if (recState._previewCtx) {
        recState._previewCtx.close().catch(() => {});
        recState._previewCtx = null;
      }
      controller.pauseSilent();
      controller.setCoachPauseOverlay(false);
      controller.setUserToggleOverride(null);
      controller.setScrubberLocked(false);
      if (btn) btn.textContent = "▶️ Riascolta con video";
      if (timerEl) timerEl.textContent = `0:00 / ${formatSecondsMmSs(Math.round(audioBuffer.duration))}`;
    };

    source.onended = stopPreview;

    const tick = () => {
      if (!recState._previewCtx) return;
      const elapsed = ctx.currentTime - startTime;
      const total = audioBuffer.duration || 1;
      if (elapsed >= total) {
        stopPreview();
        return;
      }
      if (timerEl) {
        timerEl.textContent = `${formatSecondsMmSs(Math.floor(elapsed))} / ${formatSecondsMmSs(Math.round(total))}`;
      }
      controller.setCoachPauseOverlay(isTimelinePausedAt(recState.timeline, elapsed));
      applyTimelineToController(controller, recState.timeline, elapsed);
      recState._previewRaf = requestAnimationFrame(tick);
    };

    // Tocco sul video durante l'anteprima = stop anteprima
    controller.setUserToggleOverride(() => window.playCoachDraftPreviewSync(feedbackId));
    controller.setScrubberLocked(true);
    source.start(0);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "⏹️ Stop anteprima";
    }
    recState._previewRaf = requestAnimationFrame(tick);
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "▶️ Riascolta con video";
    }
    alert("Errore anteprima: " + err.message);
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

  // Se sta già registrando ATTIVAMENTE -> FERMA la registrazione
  const existingState = activeCoachAudioRecorders.get(feedbackId);
  if (existingState && existingState.recorder) {
    if (existingState.timerInterval) clearInterval(existingState.timerInterval);
    if (existingState.recorder.state !== "inactive") {
      existingState.recorder.stop();
    }
    return;
  }

  // Se c'era una registrazione precedente in anteprima ("Registra di nuovo"), fermiamo eventuale preview e la scartiamo
  if (existingState) {
    if (existingState._previewCtx) {
      if (existingState._previewRaf) cancelAnimationFrame(existingState._previewRaf);
      try { existingState._previewSource.stop(); } catch (_) {}
      existingState._previewCtx.close().catch(() => {});
    }
    activeCoachAudioRecorders.delete(feedbackId);
    if (previewWrap) {
      previewWrap.classList.add("hidden");
      previewWrap.innerHTML = "";
    }
  }

  // Apri il player canvas se non è già aperto
  const playerBox = document.getElementById(`videoPlayerBox_${feedbackId}`);
  if (playerBox && (playerBox.classList.contains("hidden") || !playerBox._playerController)) {
    await window.playExerciseVideoFeedback(feedbackId, videoPath);
  }

  const controller = playerBox ? playerBox._playerController : null;
  if (!controller) {
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
    // L'orologio della timeline parte quando il registratore conferma l'avvio
    // (evento onstart): su iOS l'avvio del microfono può richiedere qualche
    // decimo di secondo e partire prima anticiperebbe pause/spostamenti.
    let startPerfMs = null;
    let lastPushT = -1;
    let timerInterval = null;
    let fallbackStartTimer = null;
    const DRAG_COALESCE_SEC = 0.15; // max ~7 eventi/sec durante il trascinamento
    const maxFormatted = formatSecondsMmSs(MAX_COACH_AUDIO_DURATION_SEC);

    // Interrompe un eventuale ascolto del commento già salvato
    if (typeof controller.pauseAudioSync === "function") controller.pauseAudioSync();
    controller.setUserToggleOverride(null);
    controller.setScrubberLocked(false);
    controller.setCoachPauseOverlay(false);
    controller.setMicSafeMode(true);
    controller.seekSilent(0);

    const getElapsedSec = () => (startPerfMs === null ? 0 : (performance.now() - startPerfMs) / 1000);

    const recordEvent = () => {
      if (startPerfMs === null) return;
      const evt = {
        t: Math.round(getElapsedSec() * 100) / 100,
        videoTime: Math.round((controller.currentTime || 0) * 100) / 100,
        paused: Boolean(controller.paused)
      };
      const last = timeline[timeline.length - 1];
      // Trascinamento della barra: eventi ravvicinati con lo stesso stato
      // play/pausa aggiornano l'ultimo invece di accumularsi
      if (last && last.paused === evt.paused && lastPushT >= 0 && (evt.t - lastPushT) < DRAG_COALESCE_SEC) {
        last.t = evt.t;
        last.videoTime = evt.videoTime;
        return;
      }
      timeline.push(evt);
      lastPushT = evt.t;
    };

    const updateRecUi = () => {
      const label = `${formatSecondsMmSs(Math.floor(getElapsedSec()))} / ${maxFormatted}`;
      if (btnRec) btnRec.textContent = `⏹️ Stop (${label})`;
      controller.setRecordingOverlay(`REC ${label}`);
    };

    const beginTimeline = () => {
      if (startPerfMs !== null) return;
      if (fallbackStartTimer) {
        clearTimeout(fallbackStartTimer);
        fallbackStartTimer = null;
      }
      startPerfMs = performance.now();
      controller.onStateChange(recordEvent);
      controller.play(); // emette lo stato iniziale (t = 0, video in play)
      recordEvent();
      updateRecUi();
      timerInterval = setInterval(() => {
        updateRecUi();
        if (getElapsedSec() >= MAX_COACH_AUDIO_DURATION_SEC && recorder.state !== "inactive") {
          recorder.stop();
        }
      }, 250);
      const st = activeCoachAudioRecorders.get(feedbackId);
      if (st) st.timerInterval = timerInterval;
    };

    recorder.onstart = beginTimeline;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (fallbackStartTimer) clearTimeout(fallbackStartTimer);
      if (timerInterval) clearInterval(timerInterval);
      controller.offStateChange(recordEvent);
      controller.setMicSafeMode(false);
      controller.setRecordingOverlay(null);
      controller.setHint("");
      controller.pauseSilent();
      micStream.getTracks().forEach((tr) => tr.stop());

      const finalMime = (recorder.mimeType || mimeType || "audio/mp4").split(";")[0];
      const audioBlob = new Blob(chunks, { type: finalMime });
      const pauseCount = getTimelinePauseMarkers(timeline).length;

      activeCoachAudioRecorders.set(feedbackId, {
        recordedBlob: audioBlob,
        mimeType: finalMime,
        timeline
      });

      if (btnRec) {
        btnRec.textContent = "🎙️ Registra di nuovo";
        btnRec.style.background = "";
        btnRec.style.color = "";
      }
      if (statusEl) {
        statusEl.textContent = `Audio pronto (${formatSecondsMmSs(Math.round(getElapsedSec()))}${pauseCount > 0 ? ` · ${pauseCount} ${pauseCount === 1 ? "pausa" : "pause"} sul video` : ""}). Riascoltalo e poi clicca "Salva" per inviarlo.`;
      }
      if (previewWrap) {
        previewWrap.classList.remove("hidden");
        previewWrap.innerHTML = `
          <div style="margin-top: 6px; padding: 7px 8px; border-radius: 6px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.35); display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-size:0.72rem; font-weight:700; color:#10b981;">Anteprima sincronizzata:</span>
            <div style="display:flex; gap:6px; align-items:center;">
              <span id="coachDraftTimer_${feedbackId}" style="font-size:0.7rem; color:var(--text-muted); font-variant-numeric: tabular-nums;">0:00</span>
              <button type="button" id="btnCoachDraftPreview_${feedbackId}" class="btn btn-primary btn-sm" style="padding:2px 9px; font-size:0.71rem; width:auto;" onclick="playCoachDraftPreviewSync('${feedbackId}')">▶️ Riascolta con video</button>
              <button type="button" class="btn btn-outline btn-sm" style="padding:2px 7px; font-size:0.7rem; width:auto; border-color:var(--danger); color:var(--danger);" onclick="discardCoachRecordedAudio('${feedbackId}')">Scarta</button>
            </div>
          </div>
        `;
      }
    };

    activeCoachAudioRecorders.set(feedbackId, {
      recorder,
      timerInterval: null
    });

    // Avvia registrazione (limite massimo 2 minuti)
    recorder.start(250);
    // Paracadute: se il browser non emette onstart entro 1,5 s, parti comunque
    fallbackStartTimer = setTimeout(beginTimeline, 1500);

    if (btnRec) {
      btnRec.textContent = "⏳ Avvio microfono...";
      btnRec.style.background = "#ef4444";
      btnRec.style.color = "#fff";
    }
    controller.setRecordingOverlay("REC");
    controller.setHint("Parla pure · tocca il video per fermarlo/riprenderlo · trascina la barra per andare avanti e indietro");
    if (statusEl) {
      statusEl.textContent = "Registrazione in corso: commenta e metti in pausa il video nei punti chiave (max 2 min).";
    }
  } catch (err) {
    console.error(err);
    controller.setMicSafeMode(false);
    controller.setRecordingOverlay(null);
    controller.setHint("");
    activeCoachAudioRecorders.delete(feedbackId);
    if (btnRec) {
      btnRec.style.background = "";
      btnRec.style.color = "";
    }
    alert("Permesso microfono negato o non disponibile: " + err.message);
  }
};

window.discardCoachRecordedAudio = function(feedbackId) {
  const existingState = activeCoachAudioRecorders.get(feedbackId);
  if (existingState && existingState._previewCtx) {
    if (existingState._previewRaf) cancelAnimationFrame(existingState._previewRaf);
    try { existingState._previewSource.stop(); } catch (_) {}
    existingState._previewCtx.close().catch(() => {});
  }
  activeCoachAudioRecorders.delete(feedbackId);
  const box = document.getElementById(`videoPlayerBox_${feedbackId}`);
  const ctrl = box ? box._playerController : null;
  if (ctrl) {
    ctrl.pauseSilent();
    ctrl.setCoachPauseOverlay(false);
    ctrl.setUserToggleOverride(null);
    ctrl.setScrubberLocked(false);
  }
  const previewWrap = document.getElementById(`coachAudioPreviewWrap_${feedbackId}`);
  const statusEl = document.getElementById(`coachAudioRecStatus_${feedbackId}`);
  const btnRec = document.getElementById(`btnRecordCoachAudio_${feedbackId}`);
  if (previewWrap) {
    previewWrap.classList.add("hidden");
    previewWrap.innerHTML = "";
  }
  if (statusEl) statusEl.textContent = "";
  if (btnRec) btnRec.textContent = "🎙️ Registra commento audio";
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

  // Ferma eventuale anteprima audio in corso prima di salvare
  if (recState && recState._previewCtx) {
    if (recState._previewRaf) cancelAnimationFrame(recState._previewRaf);
    try { recState._previewSource.stop(); } catch (_) {}
    recState._previewCtx.close().catch(() => {});
    recState._previewCtx = null;
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
            ${vf.video_path ? `<button type="button" class="btn btn-outline btn-sm" style="padding: 2px 8px; font-size: 0.72rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeJsAttr(vf.video_path)}', '${escapeJsAttr(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda</button>` : `<span style="font-size:0.7rem; color:var(--text-muted);">File archiviato</span>`}
            <button type="button" class="btn btn-outline btn-sm" style="padding: 2px 7px; font-size: 0.72rem; width: auto; border-color: var(--danger); color: var(--danger);" onclick="deleteAthleteExerciseVideo('${vf.id}', '${escapeJsAttr(vf.video_path || "")}', '${escapeJsAttr(vf.coach_audio_path || "")}')">🗑️</button>
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
          <button type="button" id="btnUploadVideo_${domKey}" class="btn btn-primary btn-sm" style="width: auto; white-space: nowrap;" onclick="uploadAthleteExerciseVideo('${row.workout_id}', ${row.order_index}, '${escapeJsAttr(exName)}', '${domKey}')">📤 Invia Video</button>
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
            ? `<button type="button" class="btn btn-primary btn-sm" style="padding: 3px 9px; font-size: 0.74rem; width: auto;" onclick="playExerciseVideoFeedback('${vf.id}', '${escapeJsAttr(vf.video_path)}', '${escapeJsAttr(vf.coach_audio_path || "")}', '${timelineEncoded}')">▶️ Guarda Video</button>`
            : `<span style="font-size: 0.72rem; color: var(--text-muted);">Video rimosso (>45 gg)</span>`}
        </div>
        ${vf.athlete_note ? `<div style="font-size: 0.78rem; margin-top: 5px; color: var(--text);"><strong>Domanda Atleta:</strong> ${escapeHtml(vf.athlete_note)}</div>` : ""}
        <div id="videoPlayerBox_${vf.id}" class="hidden"></div>

        <!-- Sezione Registrazione Vocale Sincronizzata del Coach (max 2 min) -->
        <div style="margin-top: 8px; padding-top: 7px; border-top: 1px dashed var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" id="btnRecordCoachAudio_${vf.id}" class="btn btn-outline btn-sm" style="width: auto; font-size: 0.74rem;" onclick="toggleCoachAudioRecording('${vf.id}', '${escapeJsAttr(vf.video_path || "")}')">
              ${hasAudio ? "🎙️ Registra nuovo audio" : "🎙️ Registra commento audio"}
            </button>
            ${hasAudio ? `<span style="font-size: 0.7rem; color: #10b981; font-weight: 700;">✅ Audio salvato</span>` : `<span style="font-size: 0.7rem; color: var(--text-muted);">Max 2 min</span>`}
          </div>
          <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
            Il video parte con la registrazione: fermalo, riprendilo e spostati con la barra mentre parli. L'atleta lo rivedrà esattamente così.
          </div>
          <div id="coachAudioRecStatus_${vf.id}" style="font-size: 0.72rem; color: var(--primary); margin-top: 4px;"></div>
          <div id="coachAudioPreviewWrap_${vf.id}" class="hidden"></div>
        </div>

        <div style="margin-top: 7px;">
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 3px;">Nota Tecnica Scritta (opzionale se registri audio):</label>
          <div style="display: flex; gap: 6px; align-items: flex-end;">
            <textarea id="coachVideoNoteInput_${vf.id}" rows="2" placeholder="Scrivi correzione tecnica o aggiungi dettagli all'audio..." style="flex: 1; min-height: 46px; font-size: 0.78rem; padding: 6px 8px; resize: vertical;">${escapeHtml(existingText)}</textarea>
            <button type="button" id="btnSaveCoachVideo_${vf.id}" class="btn btn-success btn-sm" style="width: auto; align-self: stretch;" onclick="saveCoachVideoFeedback('${vf.id}', '${clientId}', '${escapeJsAttr(clientName)}', '${workoutId}')">💾 Salva</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `<div style="margin-top: 6px;">${cardsHtml}</div>`;
}
