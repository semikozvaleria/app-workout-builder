const WEB_PUSH_VAPID_PUBLIC_KEY = "BJmaEkh8bwxyCGUz9sP0aE--xp_zOp6gOn8brT2XkOJrCF1OBijCwU_zbFPG6eYuRBBT2WxFo6cndcKY9SQm_Fo";

let activeAlerts = [];

// Apertura e chiusura del pannello Notifiche
document.getElementById("btnOpenNotifications").addEventListener("click", () => {
  const panel = document.getElementById("notificationsSection");
  panel.classList.toggle("hidden");
  document.getElementById("settingsSection").classList.add("hidden");
});

document.getElementById("btnCloseNotifications").addEventListener("click", () => {
  document.getElementById("notificationsSection").classList.add("hidden");
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Registra o aggiorna la Web Push Subscription su Supabase per l'utente corrente
async function syncDevicePushSubscription(silent = true) {
  if (!currentProfile || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (!silent) alert("Questo dispositivo/browser non supporta le notifiche push in background.");
    return false;
  }

  if (!WEB_PUSH_VAPID_PUBLIC_KEY || WEB_PUSH_VAPID_PUBLIC_KEY.includes("INSERISCI")) {
    if (!silent) alert("Chiave VAPID pubblica non configurata in notifications.js.");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(WEB_PUSH_VAPID_PUBLIC_KEY)
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return false;
    }

    const { error } = await supabaseClient
      .from("push_subscriptions")
      .upsert(
        {
          user_id: currentProfile.id,
          platform: "web",
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          user_agent: navigator.userAgent.slice(0, 250),
          updated_at: new Date().toISOString()
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Errore salvataggio push subscription:", error.message);
      if (!silent) alert("Errore registrazione dispositivo: " + error.message);
      return false;
    }

    updatePushButtonVisualState(true);
    return true;
  } catch (err) {
    console.warn("syncDevicePushSubscription:", err);
    if (!silent) alert("Impossibile attivare le notifiche push: " + err.message);
    return false;
  }
}

function updatePushButtonVisualState(isActive) {
  const btn = document.getElementById("btnEnablePush");
  if (!btn) return;
  if (isActive) {
    btn.textContent = "🔔 Push Attive";
    btn.style.borderColor = "var(--success)";
    btn.style.color = "var(--success)";
  } else {
    btn.textContent = "📲 Avvisi Device";
    btn.style.borderColor = "";
    btn.style.color = "";
  }
}

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
        ✅ Nessuna notifica al momento. Tutto aggiornato!
      </div>
    `;
  } else {
    container.innerHTML = activeAlerts.map(al => `
      <div class="alert-item-card ${al.level === 'danger' ? 'urgent' : ''}">
        <div style="flex: 1; min-width: 180px;">
          <strong style="font-size: 0.86rem; display: block; color: ${al.level === 'danger' ? 'var(--danger)' : (al.level === 'info' ? 'var(--primary)' : 'var(--warning)')};">
            ${al.title}
          </strong>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${al.message}</span>
        </div>
        ${al.actionHtml || ''}
      </div>
    `).join("");
  }

  // Se l'utente aveva già dato il permesso, riallinea silenziosamente il token del dispositivo
  if ("Notification" in window && Notification.permission === "granted" && currentProfile) {
    syncDevicePushSubscription(true);
  }
}

// Attiva permessi notifiche push reali del dispositivo (anche ad app chiusa)
document.getElementById("btnEnablePush").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Su iPhone/iPad, aggiungi prima l'app alla schermata Home (Condividi -> Aggiungi a schermata Home) per attivare le notifiche push.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const ok = await syncDevicePushSubscription(false);
    if (ok) {
      alert("✅ Notifiche Push attivate! Riceverai avvisi istantanei su questo dispositivo anche ad app chiusa.");
    }
  } else {
    alert("Permesso negato dalle impostazioni del browser/telefono.");
  }
});
