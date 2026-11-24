# 🏋️ Workout Builder — Cloud Coaching System

**Workout Builder** è una Progressive Web App (PWA) full-stack progettata per Personal Trainer e Atleti per creare, assegnare, monitorare e stampare schede di allenamento personalizzate in tempo reale su desktop e dispositivi mobili (iOS e Android).

---

## ✨ Funzionalità Principali

### 👨‍🏫 Area Personal Trainer (Coach)
* **Gestione Clienti & Codice Invito:** ogni coach dispone di un codice invito univoco da condividere con i propri atleti per collegare istantaneamente i profili.
* **Dashboard Stato & Scadenze:** panoramica ordinata per priorità delle schede attive, in scadenza ($\le 5$ giorni), scadute o da assegnare, con barra di ricerca rapida (per atleti collegati e anamnesi esterne).
* **Workout Builder Avanzato:**
  * Libreria di oltre 400 esercizi filtrabili per distretto muscolare e ricerca testuale con anteprima fotografica (esecuzione singola o fase partenza/arrivo).
  * Suddivisione per giornate (`Giorno 1` – `Giorno 7`), parametri dettagliati (`Serie/Reps`, `Rest`, `RIR/@`, `Note tecniche`) e riordino/modifica rapida.
  * Supporto completo per **Circuiti e Superset** con banner dedicati di inizio e fine blocco.
  * **Gestione Bozze:** salvataggio e ripresa di schede in lavorazione prima della pubblicazione definitiva.
  * **Storico Schede & Clonazione:** consultazione delle schede attive e archiviate di ogni atleta con possibilità di ricaricarle nel builder per nuovi mesocicli.
* **Scheda Anamnesi Privata (Atleti Collegati & Esterni):** archivio riservato esclusivamente al coach (protetto da Row Level Security) con dati anagrafici, antropometria, stile di vita, disponibilità, obiettivi, infortuni, esperienza e note riservate, collegato direttamente alla creazione scheda.
* **Diario Progressi & Feedback Bidirezionale:** visualizzazione serie per serie dei carichi registrati dall'atleta, storico dei giorni precedenti e sistema di risposta/note del coach con notifiche di lettura.
* **Statistiche & Analytics:** grafici interattivi (`Chart.js`) sull'andamento dei carichi, volume e aderenza dell'atleta.
* **Branding Personalizzato:** caricamento del logo del coach con applicazione automatica nell'intestazione dell'app (anche lato atleta) e nelle intestazioni PDF.

### 🏃 Area Atleta
* **Collegamento Rapido al Coach:** associazione tramite codice invito in un clic.
* **Doppia Modalità di Visualizzazione:**
  * *Modalità Allenamento:* registrazione rapida di `Kg`, `Reps` e `RIR` per ogni singola serie prescritta, oltre a note sull'esercizio e lettura dei feedback del coach.
  * *Scheda Pulita:* vista essenziale per consultare la scheda in sala pesi senza distrazioni.
* **Notifiche & Avvisi:** avvisi automatici per nuove schede assegnate, commenti del coach non letti e scadenze imminenti.

### 📄 Esportazione PDF A4 Multi-Pagina
* Generazione deterministica in formato **A4** ottimizzata sia per browser Desktop che per **iOS Safari**.
* Impaginazione intelligente che impedisce il taglio a metà delle righe degli esercizi, mantiene uniti i blocchi Circuito/Superset e ripete automaticamente l'intestazione della tabella a ogni cambio pagina.
* Disponibile sia per il Personal Trainer (dal Builder, anche per clienti esterni) sia per l'Atleta (direttamente dalla propria scheda).

---

## 🛠️ Stack Tecnologico

* **Frontend:** HTML5, CSS3 (Tema Scuro/Chiaro responsive + PWA `manifest.json` + Service Worker `sw.js` per caching offline).
* **Logica Applicativa:** Vanilla JavaScript modulare (`config.js`, `auth.js`, `trainer.js`, `builder.js`, `athlete.js`, `analytics.js`, `notifications.js`, `settings.js`).
* **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Row Level Security).
* **Librerie:** `html2pdf.js` (generazione PDF A4), `Chart.js` (grafici statistici).
* **Hosting:** Vercel / GitHub Pages.

---

## 🗂️ Struttura della Repository

```text
├── index.html          # Struttura principale dell'interfaccia (Auth, Trainer, Athlete, PDF template)
├── style.css           # Stili responsivi, temi Dark/Light, layout mobile iOS e impaginazione PDF
├── config.js           # Inizializzazione client Supabase e utility condivise
├── auth.js             # Login, registrazione, gestione sessione e reset stato al logout
├── trainer.js          # Dashboard clienti, ricerca, storico schede, diario progressi e anamnesi
├── builder.js          # Costruzione schede, circuiti, bozze e motore di esportazione PDF A4
├── athlete.js          # Vista atleta, logging serie/carichi, vista pulita e download PDF
├── analytics.js        # Grafici e statistiche di progressione dell'atleta
├── notifications.js    # Centro notifiche e avvisi scadenze
├── settings.js         # Cambio tema, gestione logo personalizzato ed eliminazione account
├── sw.js               # Service Worker PWA per cache e aggiornamenti
└── manifest.json       # Configurazione installazione PWA
```

---

## 🚀 Roadmap & Sviluppi Futuri

### Prossime Implementazioni (`dev`)
1. **Check-in di Fine Settimana (Atleta → Coach):** modulo settimanale per registrare peso corporeo a digiuno, qualità del sonno, stress/energia, aderenza e note, con avvisi automatici e grafico di andamento.
2. **Libreria Esercizi Personalizzati del Coach:** possibilità per ciascun trainer di creare esercizi personalizzati visibili esclusivamente a sé stesso e ai propri atleti collegati.
3. **Analisi Tecnica Video + Nota Vocale & Disegno del Coach:** caricamento video delle esecuzioni da parte dell'atleta con risposta vocale e annotazione grafica sul fermo-immagine da parte del coach (con gestione automatica dello spazio di archiviazione).

### Sviluppi Futuri Opzionali
* **Storico Misure Corporee & Circonferenze:** monitoraggio periodico (vita, fianchi, petto, arti) collegato al check-in e all'anamnesi.
* **Sostituzione Veloce Esercizio nel Builder:** scambio rapido di un esercizio mantenendo invariati serie, recuperi, RIR e note.
* **Storico Carichi & 1RM Stimato per Esercizio / Export PDF Anamnesi.**