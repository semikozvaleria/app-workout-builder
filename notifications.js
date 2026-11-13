let activeAlerts = [];

// Apertura e chiusura del pannello Notifiche
document.getElementById("btnOpenNotifications").addEventListener("click", () => {
  const panel = document.getElementById("notificationsSection");
  panel.classList.toggle("hidden");
  // Chiude le impostazioni se erano aperte
  document.getElementById("settingsSection").classList.add("hidden");
});

document.getElementById("btnCloseNotifications").addEventListener("click", () => {
  document.getElementById("notificationsSection").classList.add("hidden");
});

// Aggiorna lista avvisi e contatore campanella
function updateNotificationCenter(alertsList) {
  activeAlerts = alertsList || [];
  const badge = document.getElementById("notifCountBadge");
  const container = document.getElementById("notificationsListContainer");

  if (activeAlerts.length > 0) {
    badge.textContent = activeAlerts.length;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  if (activeAlerts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px;">
        ✅ Nessuna scadenza imminente! Tutte le schede sono in regola.
      </div>
    `;
    return;
  }

  container.innerHTML = activeAlerts.map(al => `
    <div class="alert-item-card ${al.level === 'danger' ? 'urgent' : ''}">
      <div style="flex: 1; min-width: 180px;">
        <strong style="font-size: 0.86rem; display: block; color: ${al.level === 'danger' ? 'var(--danger)' : 'var(--warning)'};">
          ${al.title}
        </strong>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${al.message}</span>
      </div>
      ${al.actionHtml || ''}
    </div>
  `).join("");

  triggerBrowserPushIfAllowed(activeAlerts);
}

// Attiva permessi notifiche di sistema del browser/telefono
document.getElementById("btnEnablePush").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Questo browser non supporta le notifiche di sistema.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    alert("Notifiche sul dispositivo attivate!");
    triggerBrowserPushIfAllowed(activeAlerts, true);
  } else {
    alert("Permesso negato dalle impostazioni del browser.");
  }
});

// Invia una notifica nativa al massimo una volta al giorno per non disturbare
function triggerBrowserPushIfAllowed(alertsList, force = false) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!alertsList || alertsList.length === 0) return;

  const todayKey = new Date().toISOString().split("T")[0];
  const storageKey = `wb_notified_${currentProfile?.id}_${todayKey}`;
  if (!force && localStorage.getItem(storageKey)) return;

  localStorage.setItem(storageKey, "1");
  const first = alertsList[0];
  const extra = alertsList.length > 1 ? ` (+ altri ${alertsList.length - 1} avvisi)` : "";
new Notification("Workout Builder - Scadenza Scheda", {
    body: `${first.title}: ${first.message}${extra}`,
    icon: currentProfile?.logo_url || "logo_W.jpeg"
  });
}
