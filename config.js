//Contiene le chiavi di Supabase, lo stato globale e le funzioni di utilità (es. pulizia testi HTML).

const SUPABASE_URL = "https://rcpegoxebgpjziwctmaz.supabase.co";
const SUPABASE_KEY = "sb_publishable_7jyLjdruc3-Jio7dyVE3ag_ekcppthX";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Stato globale condiviso tra i moduli
let currentUser = null;
let currentProfile = null;
let EXERCISE_DB = [];
let currentWorkout = [];
let trainerClients = [];

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Escape per testi inseriti dentro stringhe JS tra apici in attributi HTML
// (es. onclick="fn('${escapeJsAttr(nome)}')"): gestisce apostrofi (D'Angelo),
// backslash e a capo, poi applica l'escape HTML.
function escapeJsAttr(str) {
  if (str === null || str === undefined) return "";
  const js = String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, "\\n");
  return escapeHtml(js);
}

// Data locale "YYYY-MM-DD" (fuso del dispositivo). Da usare al posto di
// toISOString().split("T")[0], che restituisce la data UTC e tra mezzanotte
// e l'1/2 di notte in Italia darebbe il giorno precedente.
function toLocalDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Una settimana è di scarico se ha il flag deload (nuovo formato) oppure se
// Serie/Reps contiene la parola "deload" (schede create prima del flag).
function isDeloadPrescription(entry) {
  if (!entry || typeof entry !== "object") return false;
  if (entry.deload === true) return true;
  return /deload/i.test(String(entry.sets_reps || entry.setsReps || ""));
}

// Colonne bilanciate per griglie di N riquadri (settimane del mesociclo):
// massimo 3 per riga su telefoni stretti, 4 su telefoni grandi, 6 su schermi
// larghi, distribuendo i riquadri su righe il più possibile uguali.
function progGridColsStyle(n) {
  const count = Math.max(1, parseInt(n, 10) || 1);
  const cols = (maxCols) => Math.ceil(count / Math.ceil(count / maxCols));
  return `--cols-s:${cols(3)};--cols-m:${cols(4)};--cols-l:${cols(6)};`;
}
