# 🏋️ Workout Builder — Cloud Coaching System

**Workout Builder** è una Progressive Web App (PWA) per **Personal Trainer e i loro atleti**: il coach crea, assegna e segue schede di allenamento personalizzate; l'atleta le esegue, registra i carichi, invia video e check-in. Funziona su desktop e smartphone (iOS e Android) ed è installabile sulla schermata Home.

È uno strumento di lavoro per coach: niente schede precompilate o videocorsi, ogni programma è scritto dal coach per il proprio atleta.

🌐 **[workoutbuilder.it](https://workoutbuilder.it)**

---

## ✨ Funzionalità

### 👨‍🏫 Area Coach
* **Atleti e codice invito:** ogni coach ha un codice invito da mandare ai clienti per collegarli al proprio profilo.
* **Dashboard atleti:** elenco ordinato per priorità (schede scadute, in scadenza entro 5 giorni, da assegnare, novità da vedere), con ricerca rapida su atleti collegati ed esterni.
* **Pannello aderenza settimanale:** per ogni atleta le sedute di questa settimana rispetto a quelle previste dalla scheda, le ultime 4 settimane, giorni dall'ultimo allenamento e dall'ultimo check-in; in alto chi è fermo o in ritardo.
* **Workout Builder:**
  * Libreria di oltre 400 esercizi con foto (partenza/arrivo), filtri per distretto e ricerca; **esercizi personalizzati** del coach con le proprie foto, visibili solo a lui e ai suoi atleti.
  * Giornate (`Giorno 1` – `Giorno 7`), `Serie/Reps`, `Rest`, `RIR/@`, note tecniche, riordino e modifica rapida.
  * **Circuiti e superset** con inizio/fine blocco.
  * **Programmazione classica** (scheda unica) o **a mesociclo** da 2 a 10 settimane, con progressione per settimana di serie/reps, recupero, RIR e note, scorciatoie (*Copia Sett. 1*, *+1 rep/sett.*, *-1 RIR/sett.*, *Deload* calcolato) e PDF con le settimane in colonna.
  * **Bozze**, ricarica della scheda attiva e **clonazione dallo storico** (progressione compresa) per il mesociclo successivo.
* **Anamnesi privata** (atleti collegati ed esterni): dati anagrafici, antropometria, stile di vita, disponibilità, obiettivi, infortuni, esperienza e note riservate, visibili solo al coach (Row Level Security).
* **Diario progressi:** carichi registrati serie per serie (con la settimana del mesociclo), storico dei giorni precedenti e risposta del coach sotto ogni esercizio.
* **Analisi tecnica video:** l'atleta carica il video dell'esecuzione; il coach registra un **commento vocale** mentre ferma, sposta e **disegna sul video** (mano libera, linea, freccia, cerchio, angolo con i gradi). L'atleta rivede video, voce e disegni perfettamente sincronizzati.
* **Check-in settimanali:** peso, aderenza, sonno, energia, stress, note e, facoltativi, **misure corporee** (con variazione rispetto al check-in precedente) e **foto dei progressi** fronte/lato/retro con **confronto prima/dopo** tra due date.
* **Statistiche** (`Chart.js`): costanza, tonnellaggio, peso corporeo, carichi e 1RM stimato per esercizio, serie per gruppo muscolare, calendario delle sedute.
* **Branding:** logo del coach nell'intestazione dell'app (anche lato atleta) e nei PDF.

### 🏃 Area Atleta
* **Collegamento al coach** con il codice invito.
* **Modalità Allenamento** (Kg, ripetizioni e RIR per ogni serie, note) e **Scheda Pulita** per la sala pesi.
* **Mesociclo:** settimana in corso selezionata in automatico, settimane di scarico evidenziate, carichi della settimana precedente come riferimento.
* **Video dell'esecuzione** (max 30 s) con domanda al coach e riascolto del commento sincronizzato con i disegni.
* **Check-in settimanale** con misure e foto facoltative e storico delle risposte del coach.
* **PDF della scheda** e **notifiche push** (nuove schede, risposte del coach, scadenze).

### 📄 PDF A4
* Impaginazione A4 deterministica, ottimizzata anche per **iOS Safari**: niente righe tagliate a metà, blocchi circuito tenuti insieme, intestazione della tabella ripetuta a ogni pagina.
* Verticale per la scheda classica, orizzontale con le settimane in colonna per il mesociclo.
* Disponibile per il coach (anche per clienti esterni) e per l'atleta.

---

## 🛠️ Stack Tecnologico

* **Frontend:** HTML5, CSS3 (tema scuro/chiaro, layout responsive verificato da 320 px a desktop), PWA (`manifest.json` + Service Worker `sw.js`).
* **Logica:** JavaScript vanilla modulare, senza build.
* **Backend:** [Supabase](https://supabase.com/) — PostgreSQL, Auth, Row Level Security, Storage (video, audio e foto privati con URL firmati temporanei), Edge Functions (email e notifiche push).
* **Librerie (versioni fisse):** `@supabase/supabase-js` 2.119.2, `Chart.js` 4.6.2, `html2pdf.js` 0.10.1.
* **Hosting:** GitHub Pages dal branch `main` (dominio `workoutbuilder.it`). Lo sviluppo avviene su `dev` e passa in `main` dopo le prove.

---

## 🗂️ Struttura della Repository

```text
├── index.html          # Interfaccia (accesso, area coach, area atleta, modello PDF)
├── style.css           # Stili, temi scuro/chiaro, layout mobile, impaginazione PDF
├── config.js           # Client Supabase, stato globale e utility condivise
├── auth.js             # Accesso, registrazione, sessione, intestazione utente
├── trainer.js          # Dashboard atleti, aderenza, storico schede, progressi
├── builder.js          # Builder, mesociclo, circuiti, bozze, esercizi personalizzati, PDF
├── athlete.js          # Scheda atleta, registrazione carichi, settimane, PDF
├── video-feedback.js   # Video esecuzione, commento vocale sincronizzato, disegni
├── checkins.js         # Check-in settimanali, misure, foto e confronto
├── anamnesis.js        # Anamnesi privata e atleti esterni
├── analytics.js        # Statistiche e grafici
├── notifications.js    # Centro notifiche e notifiche push
├── settings.js         # Impostazioni, logo, guida in-app, eliminazione account
├── sw.js               # Service Worker (cache e notifiche push)
├── manifest.json       # Installazione PWA
└── supabase/           # Script SQL da eseguire nel SQL Editor di Supabase
```

### Database (`supabase/`)
Le modifiche allo schema sono salvate come script SQL datati, da eseguire una volta nel **SQL Editor** di Supabase prima di pubblicare la versione che le usa:
* `2026-11-27_checkin_foto_misure.sql` — colonne `measurements` e `photo_paths` in `weekly_checkins`, bucket privato `progress-photos` e relative regole di accesso.

Storage: `exercise-videos` (video e audio, limite 50 MB per file, pulizia automatica dopo 45 giorni) e `progress-photos` (foto dei check-in, conservate nel tempo per il confronto).

---

## 🚀 Roadmap

### Prossimi sviluppi
* **Sostituzione veloce di un esercizio** nel builder mantenendo serie, recuperi, RIR e progressione.
* **Record personali** riconosciuti in automatico e storico dei massimali per esercizio.
* **Modelli di scheda del coach** da riutilizzare per più atleti.
* **Timer di recupero** per l'atleta durante l'allenamento.
* **Chat coach–atleta** ed **export PDF dell'anamnesi**.

### Dopo il lancio gratuito
* **Pagamenti e abbonamenti** degli atleti.
