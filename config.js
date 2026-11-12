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
