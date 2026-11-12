// Database definitivo esercizi - Workout Builder Carlo Ratto
// Database spostato su SUPABASE --> rimozione esercizi.js presto 

const BASE_IMG = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises";

const EXERCISE_DB = [
// ==========================================
  // --- SPALLE ---
  // ==========================================
  {
    id: "shoulder_press_machine",
    name: "Shoulder Press Machine",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/MK6NbpTf/Whats-App-Image-2026-11-09-at-23-33-30(2).jpg",
    imgEnd: "https://i.postimg.cc/MK6NbpTf/Whats-App-Image-2026-11-09-at-23-33-30(2).jpg"
  },
  {
    id: "lateral_raise_machine_seduta",
    name: "Lateral Raise Machine seduta",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/nz6R8nYc/Whats-App-Image-2026-11-09-at-23-34-20.jpg",
    imgEnd: "https://i.postimg.cc/nz6R8nYc/Whats-App-Image-2026-11-09-at-23-34-20.jpg"
  },
  {
    id: "lateral_raise_machine_in_piedi",
    name: "Lateral Raise Machine in piedi",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/RFjsrvQZ/Whats-App-Image-2026-11-09-at-23-36-37(1).jpg",
    imgEnd: "https://i.postimg.cc/hjHyFKbG/Whats-App-Image-2026-11-09-at-23-36-37.jpg"
  },
  {
    id: "rear_delt_machine",
    name: "Rear Delt Machine",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/9FcPD4M7/Whats-App-Image-2026-11-09-at-23-37-35.jpg",
    imgEnd: "https://i.postimg.cc/9FcPD4M7/Whats-App-Image-2026-11-09-at-23-37-35.jpg"
  },
  {
    id: "reverse_pec_deck",
    name: "Reverse Pec Deck",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/5Nf5XH0Y/Whats-App-Image-2026-11-09-at-23-38-25.jpg",
    imgEnd: "https://i.postimg.cc/5Nf5XH0Y/Whats-App-Image-2026-11-09-at-23-38-25.jpg"
  },
  {
    id: "military_press_bilanciere",
    name: "Military Press bilanciere",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Standing_Military_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Military_Press/1.jpg`
  },
  {
    id: "overhead_press_seduto",
    name: "Overhead Press seduto",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Seated_Barbell_Military_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Barbell_Military_Press/1.jpg`
  },
  {
    id: "push_press",
    name: "Push Press",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/BZpLwmS4/Whats-App-Image-2026-11-09-at-23-39-21.jpg",
    imgEnd: "https://i.postimg.cc/BZpLwmS4/Whats-App-Image-2026-11-09-at-23-39-21.jpg"
  },
  {
    id: "push_jerk",
    name: "Push Jerk",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/8k4JnZpS/Whats-App-Image-2026-11-09-at-23-40-15.jpg",
    imgEnd: "https://i.postimg.cc/8k4JnZpS/Whats-App-Image-2026-11-09-at-23-40-15.jpg"
  },
  {
    id: "split_jerk",
    name: "Split Jerk",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/qBwhZ1J0/Whats-App-Image-2026-11-09-at-23-40-56.jpg",
    imgEnd: "https://i.postimg.cc/qBwhZ1J0/Whats-App-Image-2026-11-09-at-23-40-56.jpg"
  },
  {
    id: "strict_press",
    name: "Strict Press",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Standing_Military_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Military_Press/1.jpg`
  },
  {
    id: "z_press",
    name: "Z Press",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/xC0jvSbk/Whats-App-Image-2026-11-09-at-23-42-29.jpg",
    imgEnd: "https://i.postimg.cc/xC0jvSbk/Whats-App-Image-2026-11-09-at-23-42-29.jpg"
  },
  {
    id: "shoulder_press_al_multipower",
    name: "Shoulder Press al Multipower",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Smith_Machine_Overhead_Shoulder_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Overhead_Shoulder_Press/1.jpg`
  },
  {
    id: "upright_row_bilanciere",
    name: "Upright Row bilanciere",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Upright_Barbell_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Upright_Barbell_Row/1.jpg`
  },
  {
    id: "shoulder_press_manubri_seduto",
    name: "Shoulder Press manubri seduto",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Seated_Dumbbell_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Dumbbell_Press/1.jpg`
  },
  {
    id: "shoulder_press_manubri_in_piedi",
    name: "Shoulder Press manubri in piedi",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Standing_Dumbbell_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Dumbbell_Press/1.jpg`
  },
  {
    id: "arnold_press",
    name: "Arnold Press",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Arnold_Dumbbell_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Arnold_Dumbbell_Press/1.jpg`
  },
  {
    id: "alzate_laterali_manubri",
    name: "Alzate laterali manubri",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Side_Lateral_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Side_Lateral_Raise/1.jpg`
  },
  {
    id: "alzate_laterali_da_seduto",
    name: "Alzate laterali da seduto",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Seated_Side_Lateral_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Side_Lateral_Raise/1.jpg`
  },
  {
    id: "alzate_laterali_su_panca_inclinata",
    name: "Alzate laterali su panca inclinata",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/NMgG6wr9/Whats-App-Image-2026-11-09-at-23-43-57.jpg",
    imgEnd: "https://i.postimg.cc/NMgG6wr9/Whats-App-Image-2026-11-09-at-23-43-57.jpg"
  },
  {
    id: "alzate_frontali_manubri",
    name: "Alzate frontali manubri",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Front_Dumbbell_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Front_Dumbbell_Raise/1.jpg`
  },
  {
    id: "reverse_fly_manubri",
    name: "Reverse Fly manubri",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench/0.jpg`,
    imgEnd: `${BASE_IMG}/Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench/1.jpg`
  },
  {
    id: "reverse_fly_su_panca_inclinata",
    name: "Reverse Fly su panca inclinata",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/x8BS4rqL/Whats-App-Image-2026-11-09-at-23-45-02.jpg",
    imgEnd: "https://i.postimg.cc/x8BS4rqL/Whats-App-Image-2026-11-09-at-23-45-02.jpg"
  },
  {
    id: "y_raise_manubri",
    name: "Y Raise manubri",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/L5GMbdhz/Whats-App-Image-2026-11-09-at-23-46-06.jpg",
    imgEnd: "https://i.postimg.cc/L5GMbdhz/Whats-App-Image-2026-11-09-at-23-46-06.jpg"
  },
  {
    id: "alzate_laterali_al_cavo_basso",
    name: "Alzate laterali al cavo basso",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/rmP6D61b/Whats-App-Image-2026-11-09-at-23-46-51.jpg",
    imgEnd: "https://i.postimg.cc/rmP6D61b/Whats-App-Image-2026-11-09-at-23-46-51.jpg"
  },
  {
    id: "alzate_laterali_al_cavo_dietro_il_corpo",
    name: "Alzate laterali al cavo dietro il corpo",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/G25040Ff/Whats-App-Image-2026-11-09-at-23-49-31.jpg",
    imgEnd: "https://i.postimg.cc/G25040Ff/Whats-App-Image-2026-11-09-at-23-49-31.jpg"
  },
  {
    id: "alzate_laterali_bilaterali_ai_cavi",
    name: "Alzate laterali bilaterali ai cavi",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/VN7sWV9V/Whats-App-Image-2026-11-09-at-23-50-19.jpg",
    imgEnd: "https://i.postimg.cc/VN7sWV9V/Whats-App-Image-2026-11-09-at-23-50-19.jpg"
  },
  {
    id: "alzate_frontali_al_cavo",
    name: "Alzate frontali al cavo",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Front_Cable_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Front_Cable_Raise/1.jpg`
  },
  {
    id: "reverse_fly_ai_cavi",
    name: "Reverse Fly ai cavi",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Cable_Rear_Delt_Fly/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Rear_Delt_Fly/1.jpg`
  },
  {
    id: "face_pull_al_cavo_alto",
    name: "Face Pull al cavo alto",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Face_Pull/0.jpg`,
    imgEnd: `${BASE_IMG}/Face_Pull/1.jpg`
  },
  {
    id: "cable_y_raise",
    name: "Cable Y Raise",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/fbHWfr7P/Whats-App-Image-2026-11-09-at-23-51-28.jpg",
    imgEnd: "https://i.postimg.cc/fbHWfr7P/Whats-App-Image-2026-11-09-at-23-51-28.jpg"
  },
  {
    id: "cable_upright_row",
    name: "Cable Upright Row",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Upright_Cable_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Upright_Cable_Row/1.jpg`
  },
  {
    id: "extrarotazioni_al_cavo",
    name: "Extrarotazioni al cavo",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/jj8q4F6k/Whats-App-Image-2026-11-09-at-23-52-15.jpg",
    imgEnd: "https://i.postimg.cc/jj8q4F6k/Whats-App-Image-2026-11-09-at-23-52-15.jpg"
  },
  {
    id: "intrarotazioni_al_cavo",
    name: "Intrarotazioni al cavo",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Cable_Internal_Rotation/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Internal_Rotation/1.jpg`
  },
  {
    id: "extrarotazioni_con_elastico",
    name: "Extrarotazioni con elastico",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/zDh5yBMz/Whats-App-Image-2026-11-09-at-23-56-11.jpg",
    imgEnd: "https://i.postimg.cc/zDh5yBMz/Whats-App-Image-2026-11-09-at-23-56-11.jpg"
  },
  {
    id: "band_pull_apart",
    name: "Band Pull Apart",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Band_Pull_Apart/0.jpg`,
    imgEnd: `${BASE_IMG}/Band_Pull_Apart/1.jpg`
  },
  {
    id: "shrug_manubri",
    name: "Shrug manubri",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Dumbbell_Shrug/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Shrug/1.jpg`
  },
  {
    id: "shrug_bilanciere",
    name: "Shrug bilanciere",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Barbell_Shrug/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Shrug/1.jpg`
  },
  {
    id: "shrug_al_multipower",
    name: "Shrug al Multipower",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/fWdZVLFD/Whats-App-Image-2026-11-09-at-23-57-36.jpg",
    imgEnd: "https://i.postimg.cc/fWdZVLFD/Whats-App-Image-2026-11-09-at-23-57-36.jpg"
  },
  {
    id: "shrug_alla_trap_bar",
    name: "Shrug alla Trap Bar",
    muscle: "Spalle",
    imgStart: "https://i.postimg.cc/59z1X0Gx/Whats-App-Image-2026-11-09-at-23-58-32.jpg",
    imgEnd: "https://i.postimg.cc/59z1X0Gx/Whats-App-Image-2026-11-09-at-23-58-32.jpg"
  },
  {
    id: "scapular_push_up",
    name: "Scapular Push-Up",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Pushups/0.jpg`,
    imgEnd: `${BASE_IMG}/Pushups/0.jpg`
  },
  {
    id: "wall_slide",
    name: "Wall Slide",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Standing_Military_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Military_Press/1.jpg`
  },
  {
    id: "prone_y_t_w_raise",
    name: "Prone Y-T-W Raise",
    muscle: "Spalle",
    imgStart: `${BASE_IMG}/Hyperextensions_Back_Extensions/0.jpg`,
    imgEnd: `${BASE_IMG}/Hyperextensions_Back_Extensions/1.jpg`
  },

  // ==========================================
  // --- BICIPITI ---
  // ==========================================
  {
    id: "biceps_curl_machine",
    name: "Biceps Curl Machine",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/KcPwXgwk/Whats-App-Image-2026-11-10-at-00-00-26.jpg",
    imgEnd: "https://i.postimg.cc/KcPwXgwk/Whats-App-Image-2026-11-10-at-00-00-26.jpg"
  },
  {
    id: "preacher_curl_machine",
    name: "Preacher Curl Machine",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/KcPwXgwk/Whats-App-Image-2026-11-10-at-00-00-26.jpg",
    imgEnd: "https://i.postimg.cc/KcPwXgwk/Whats-App-Image-2026-11-10-at-00-00-26.jpg"
  },
  {
    id: "curl_bilanciere_dritto",
    name: "Curl bilanciere dritto",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Barbell_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Curl/1.jpg`
  },
  {
    id: "curl_bilanciere_ez",
    name: "Curl bilanciere EZ",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/EZ-Bar_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/EZ-Bar_Curl/1.jpg`
  },
  {
    id: "preacher_curl_bilanciere_ez",
    name: "Preacher Curl bilanciere EZ",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Preacher_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Preacher_Curl/1.jpg`
  },
  {
    id: "spider_curl_bilanciere_ez",
    name: "Spider Curl bilanciere EZ",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Spider_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Spider_Curl/1.jpg`
  },
  {
    id: "curl_manubri",
    name: "Curl manubri",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Dumbbell_Bicep_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Bicep_Curl/1.jpg`
  },
  {
    id: "curl_manubri_da_seduto",
    name: "Curl manubri da seduto",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Seated_Dumbbell_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Dumbbell_Curl/1.jpg`
  },
  {
    id: "curl_manubri_su_panca_inclinata",
    name: "Curl manubri su panca inclinata",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Incline_Dumbbell_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Incline_Dumbbell_Curl/1.jpg`
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Hammer_Curls/0.jpg`,
    imgEnd: `${BASE_IMG}/Hammer_Curls/1.jpg`
  },
  {
    id: "concentration_curl",
    name: "Concentration Curl",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Concentration_Curls/0.jpg`,
    imgEnd: `${BASE_IMG}/Concentration_Curls/1.jpg`
  },
  {
    id: "preacher_curl_manubrio",
    name: "Preacher Curl manubrio",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/One_Arm_Dumbbell_Preacher_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/One_Arm_Dumbbell_Preacher_Curl/1.jpg`
  },
  {
    id: "spider_curl_manubri",
    name: "Spider Curl manubri",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Spider_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Spider_Curl/1.jpg`
  },
  {
    id: "curl_al_cavo_basso_con_barra",
    name: "Curl al cavo basso con barra",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/1RG2xN2V/Whats-App-Image-2026-11-10-at-00-02-52.jpg",
    imgEnd: "https://i.postimg.cc/1RG2xN2V/Whats-App-Image-2026-11-10-at-00-02-52.jpg"
  },
  {
    id: "curl_al_cavo_basso_con_corda",
    name: "Curl al cavo basso con corda",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Hammer_Curls_-_Rope_Attachment/1.jpg`
  },
  {
    id: "curl_al_cavo_unilaterale",
    name: "Curl al cavo unilaterale",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/3rXVMDVk/Whats-App-Image-2026-11-10-at-00-03-30.jpg",
    imgEnd: "https://i.postimg.cc/3rXVMDVk/Whats-App-Image-2026-11-10-at-00-03-30.jpg"
  },
  {
    id: "bayesian_curl",
    name: "Bayesian Curl",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/7hHVrbJC/Whats-App-Image-2026-11-10-at-00-04-08.jpg",
    imgEnd: "https://i.postimg.cc/7hHVrbJC/Whats-App-Image-2026-11-10-at-00-04-08.jpg"
  },
  {
    id: "high_cable_curl",
    name: "High Cable Curl",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Overhead_Cable_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Overhead_Cable_Curl/1.jpg`
  },
  {
    id: "preacher_curl_al_cavo",
    name: "Preacher Curl al cavo",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/Y0r3BjLv/Whats-App-Image-2026-11-10-at-00-05-21.jpg",
    imgEnd: "https://i.postimg.cc/Y0r3BjLv/Whats-App-Image-2026-11-10-at-00-05-21.jpg"
  },
  {
    id: "hammer_curl_al_cavo",
    name: "Hammer Curl al cavo",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Hammer_Curls_-_Rope_Attachment/1.jpg`
  },
  {
    id: "reverse_curl_al_cavo",
    name: "Reverse Curl al cavo",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Reverse_Cable_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Reverse_Cable_Curl/1.jpg`
  },

  // ==========================================
  // --- TRICIPITI ---
  // ==========================================
  {
    id: "triceps_extension_machine",
    name: "Triceps Extension Machine",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/BbSgftP6/Whats-App-Image-2026-11-10-at-00-06-34.jpg",
    imgEnd: "https://i.postimg.cc/BbSgftP6/Whats-App-Image-2026-11-10-at-00-06-34.jpg"
  },
  {
    id: "dip_machine",
    name: "Dip Machine",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/JzLwgCRb/Whats-App-Image-2026-11-10-at-00-07-27.jpg",
    imgEnd: "https://i.postimg.cc/JzLwgCRb/Whats-App-Image-2026-11-10-at-00-07-27.jpg"
  },
  {
    id: "panca_presa_stretta_al_multipower",
    name: "Panca presa stretta al Multipower",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Smith_Machine_Close-Grip_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Close-Grip_Bench_Press/1.jpg`
  },
  {
    id: "jm_press",
    name: "JM Press",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Close-Grip_Barbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Close-Grip_Barbell_Bench_Press/1.jpg`
  },
  {
    id: "french_press_bilanciere_ez",
    name: "French Press bilanciere EZ",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Decline_EZ_Bar_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_EZ_Bar_Triceps_Extension/1.jpg`
  },
  {
    id: "french_press_manubrio_singolo",
    name: "French Press manubrio singolo",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/One_Arm_Pronated_Dumbbell_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/One_Arm_Pronated_Dumbbell_Triceps_Extension/1.jpg`
  },
  {
    id: "french_press_due_manubri",
    name: "French Press due manubri",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/zGrmMYqT/Whats-App-Image-2026-11-10-at-00-08-36.jpg",
    imgEnd: "https://i.postimg.cc/zGrmMYqT/Whats-App-Image-2026-11-10-at-00-08-36.jpg"
  },
  {
    id: "estensioni_tricipiti_sopra_testa_con_manubrio",
    name: "Estensioni tricipiti sopra testa con manubrio",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Standing_Dumbbell_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Dumbbell_Triceps_Extension/1.jpg`
  },
  {
    id: "kickback_manubrio",
    name: "Kickback manubrio",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Tricep_Dumbbell_Kickback/0.jpg`,
    imgEnd: `${BASE_IMG}/Tricep_Dumbbell_Kickback/1.jpg`
  },
  {
    id: "pushdown_barra_dritta",
    name: "Pushdown barra dritta",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Triceps_Pushdown/0.jpg`,
    imgEnd: `${BASE_IMG}/Triceps_Pushdown/1.jpg`
  },
  {
    id: "pushdown_barra_v",
    name: "Pushdown barra V",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Triceps_Pushdown_-_V-Bar_Attachment/0.jpg`,
    imgEnd: `${BASE_IMG}/Triceps_Pushdown_-_V-Bar_Attachment/1.jpg`
  },
  {
    id: "pushdown_corda",
    name: "Pushdown corda",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
    imgEnd: `${BASE_IMG}/Triceps_Pushdown_-_Rope_Attachment/1.jpg`
  },
  {
    id: "pushdown_presa_inversa",
    name: "Pushdown presa inversa",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Reverse_Grip_Triceps_Pushdown/0.jpg`,
    imgEnd: `${BASE_IMG}/Reverse_Grip_Triceps_Pushdown/1.jpg`
  },
  {
    id: "pushdown_unilaterale",
    name: "Pushdown unilaterale",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_One_Arm_Tricep_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_One_Arm_Tricep_Extension/1.jpg`
  },
  {
    id: "pushdown_unilaterale_presa_inversa",
    name: "Pushdown unilaterale presa inversa",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_One_Arm_Tricep_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_One_Arm_Tricep_Extension/1.jpg`
  },
  {
    id: "overhead_extension_corda",
    name: "Overhead Extension corda",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_Rope_Overhead_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Rope_Overhead_Triceps_Extension/1.jpg`
  },
  {
    id: "overhead_extension_barra",
    name: "Overhead Extension barra",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_Rope_Overhead_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Rope_Overhead_Triceps_Extension/1.jpg`
  },
  {
    id: "overhead_extension_unilaterale",
    name: "Overhead Extension unilaterale",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/NfTqpjvN/Whats-App-Image-2026-11-10-at-00-10-10.jpg",
    imgEnd: "https://i.postimg.cc/NfTqpjvN/Whats-App-Image-2026-11-10-at-00-10-10.jpg"
  },
  {
    id: "cross_body_triceps_extension",
    name: "Cross Body Triceps Extension",
    muscle: "Braccia",
    imgStart: "https://i.postimg.cc/3wxq5KVD/Whats-App-Image-2026-11-10-at-00-11-02.jpg",
    imgEnd: "https://i.postimg.cc/3wxq5KVD/Whats-App-Image-2026-11-10-at-00-11-02.jpg"
  },
  {
    id: "kickback_al_cavo",
    name: "Kickback al cavo",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Tricep_Dumbbell_Kickback/0.jpg`,
    imgEnd: `${BASE_IMG}/Tricep_Dumbbell_Kickback/1.jpg`
  },
  {
    id: "estensioni_tricipiti_al_cavo_da_sdraiato",
    name: "Estensioni tricipiti al cavo da sdraiato",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Cable_Lying_Triceps_Extension/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Lying_Triceps_Extension/1.jpg`
  },
  {
    id: "dip",
    name: "Dip",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Dips_-_Triceps_Version/0.jpg`,
    imgEnd: `${BASE_IMG}/Dips_-_Triceps_Version/1.jpg`
  },
  {
    id: "bodyweight_triceps_extension",
    name: "Bodyweight Triceps Extension",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Close-Grip_Push-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Close-Grip_Push-Up/1.jpg`
  },
  {
    id: "ring_triceps_extension",
    name: "Ring Triceps Extension",
    muscle: "Braccia",
    imgStart: `${BASE_IMG}/Close-Grip_Push-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Close-Grip_Push-Up/1.jpg`
  },
  // ==========================================
  // --- ADDOME / CORE / LOMBARI ---
  // ==========================================
  {
    id: "abdominal_crunch_machine",
    name: "Abdominal Crunch Machine",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/CxN2QZPN/Whats-App-Image-2026-11-10-at-00-12-32.jpg",
    imgEnd: "https://i.postimg.cc/CxN2QZPN/Whats-App-Image-2026-11-10-at-00-12-32.jpg"
  },
  {
    id: "cable_crunch_ginocchio",
    name: "Cable Crunch in Ginocchio",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/Z5cQM97L/Whats-App-Image-2026-11-10-at-00-13-14.jpg",
    imgEnd: "https://i.postimg.cc/Z5cQM97L/Whats-App-Image-2026-11-10-at-00-13-14.jpg"
  },
  {
    id: "pallof_press",
    name: "Pallof Press",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/SN4DbSzj/Whats-App-Image-2026-11-10-at-00-14-14.jpg",
    imgEnd: "https://i.postimg.cc/SN4DbSzj/Whats-App-Image-2026-11-10-at-00-14-14.jpg"
  },
  {
    id: "cable_rotation",
    name: "Cable Rotation",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/zXN0YzRv/Whats-App-Image-2026-11-10-at-00-15-22.jpg",
    imgEnd: "https://i.postimg.cc/zXN0YzRv/Whats-App-Image-2026-11-10-at-00-15-22.jpg"
  },
  {
    id: "crunch_classico",
    name: "Crunch",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Crunches/0.jpg`,
    imgEnd: `${BASE_IMG}/Crunches/1.jpg`
  },
  {
    id: "reverse_crunch",
    name: "Reverse Crunch",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Reverse_Crunch/0.jpg`,
    imgEnd: `${BASE_IMG}/Reverse_Crunch/1.jpg`
  },
  {
    id: "bicycle_crunch",
    name: "Bicycle Crunch",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Air_Bike/0.jpg`,
    imgEnd: `${BASE_IMG}/Air_Bike/1.jpg`
  },
  {
    id: "sit_up",
    name: "Sit-Up",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Sit-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Sit-Up/1.jpg`
  },
  {
    id: "v_up",
    name: "V-Up",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Jackknife_Sit-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Jackknife_Sit-Up/1.jpg`
  },
  {
    id: "toe_touch_crunch",
    name: "Toe Touch Crunch",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Crunches/0.jpg`,
    imgEnd: `${BASE_IMG}/Crunches/1.jpg`
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Dead_Bug/0.jpg`,
    imgEnd: `${BASE_IMG}/Dead_Bug/1.jpg`
  },
  {
    id: "dead_bug_elastico",
    name: "Dead Bug con Elastico",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Dead_Bug/0.jpg`,
    imgEnd: `${BASE_IMG}/Dead_Bug/1.jpg`
  },
  {
    id: "bird_dog",
    name: "Bird Dog",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/gkpNbz6J/Whats-App-Image-2026-11-10-at-00-17-25.jpg",
    imgEnd: "https://i.postimg.cc/gkpNbz6J/Whats-App-Image-2026-11-10-at-00-17-25.jpg"
  },
  {
    id: "plank",
    name: "Plank",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/mDx73jY2/Whats-App-Image-2026-11-10-at-00-18-04.jpg",
    imgEnd: "https://i.postimg.cc/mDx73jY2/Whats-App-Image-2026-11-10-at-00-18-04.jpg"
  },
  {
    id: "plank_zavorrato",
    name: "Plank Zavorrato",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/gJ93ysV2/Whats-App-Image-2026-11-10-at-00-18-46.jpg",
    imgEnd: "https://i.postimg.cc/gJ93ysV2/Whats-App-Image-2026-11-10-at-00-18-46.jpg"
  },
  {
    id: "plank_sollevamento_gamba",
    name: "Plank con Sollevamento Gamba",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/W3R0m8Gp/Whats-App-Image-2026-11-10-at-00-19-30.jpg",
    imgEnd: "https://i.postimg.cc/W3R0m8Gp/Whats-App-Image-2026-11-10-at-00-19-30.jpg"
  },
  {
    id: "side_plank",
    name: "Side Plank",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/1tcVGQ54/Whats-App-Image-2026-11-10-at-00-20-36.jpg",
    imgEnd: "https://i.postimg.cc/1tcVGQ54/Whats-App-Image-2026-11-10-at-00-20-36.jpg"
  },
  {
    id: "side_plank_abduzione",
    name: "Side Plank con Abduzione",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/xCyNv2T8/Whats-App-Image-2026-11-10-at-00-21-38.jpg",
    imgEnd: "https://i.postimg.cc/xCyNv2T8/Whats-App-Image-2026-11-10-at-00-21-38.jpg"
  },
  {
    id: "hollow_body_hold",
    name: "Hollow Body Hold",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Jackknife_Sit-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Jackknife_Sit-Up/0.jpg`
  },
  {
    id: "hollow_rock",
    name: "Hollow Rock",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Jackknife_Sit-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Jackknife_Sit-Up/1.jpg`
  },
  {
    id: "superman",
    name: "Superman",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Superman/0.jpg`,
    imgEnd: `${BASE_IMG}/Superman/1.jpg`
  },
  {
    id: "mountain_climber",
    name: "Mountain Climber",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Mountain_Climbers/0.jpg`,
    imgEnd: `${BASE_IMG}/Mountain_Climbers/1.jpg`
  },
  {
    id: "bear_crawl",
    name: "Bear Crawl",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/LXBgtp6X/Whats-App-Image-2026-11-10-at-00-22-47.jpg",
    imgEnd: "https://i.postimg.cc/LXBgtp6X/Whats-App-Image-2026-11-10-at-00-22-47.jpg"
  },
  {
    id: "bear_plank",
    name: "Bear Plank",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/zB5VXcwM/Whats-App-Image-2026-11-10-at-00-23-47.jpg",
    imgEnd: "https://i.postimg.cc/zB5VXcwM/Whats-App-Image-2026-11-10-at-00-23-47.jpg"
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/XJ3p7zKm/Whats-App-Image-2026-11-10-at-00-25-23.jpg",
    imgEnd: "https://i.postimg.cc/XJ3p7zKm/Whats-App-Image-2026-11-10-at-00-25-23.jpg"
  },
  {
    id: "scissor_kick",
    name: "Scissor Kick",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/gJdnkTy7/Whats-App-Image-2026-11-10-at-00-25-34.jpg",
    imgEnd: "https://i.postimg.cc/gJdnkTy7/Whats-App-Image-2026-11-10-at-00-25-34.jpg"
  },
  {
    id: "leg_raise_terra",
    name: "Leg Raise a Terra",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Flat_Bench_Lying_Leg_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Flat_Bench_Lying_Leg_Raise/1.jpg`
  },
  {
    id: "dragon_flag",
    name: "Dragon Flag",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/LsSHzZqH/Whats-App-Image-2026-11-10-at-00-27-08.jpg",
    imgEnd: "https://i.postimg.cc/LsSHzZqH/Whats-App-Image-2026-11-10-at-00-27-08.jpg"
  },
  {
    id: "copenhagen_plank",
    name: "Copenhagen Plank",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/YS7p1m42/Whats-App-Image-2026-11-10-at-00-28-10.jpg",
    imgEnd: "https://i.postimg.cc/YS7p1m42/Whats-App-Image-2026-11-10-at-00-28-10.jpg"
  },
  {
    id: "hanging_knee_raise",
    name: "Hanging Knee Raise",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/GpRcksBL/Whats-App-Image-2026-11-10-at-00-28-59.jpg",
    imgEnd: "https://i.postimg.cc/GpRcksBL/Whats-App-Image-2026-11-10-at-00-28-59.jpg"
  },
  {
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/prQNVsZY/Whats-App-Image-2026-11-10-at-00-30-02.jpg",
    imgEnd: "https://i.postimg.cc/prQNVsZY/Whats-App-Image-2026-11-10-at-00-30-02.jpg"
  },
  {
    id: "toes_to_bar",
    name: "Toes-to-Bar",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/hv8F42r8/Whats-App-Image-2026-11-10-at-00-30-44.jpg",
    imgEnd: "https://i.postimg.cc/hv8F42r8/Whats-App-Image-2026-11-10-at-00-30-44.jpg"
  },
  {
    id: "l_sit_parallele",
    name: "L-Sit Parallele",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/90P3XLp7/Whats-App-Image-2026-11-10-at-00-31-33.jpg",
    imgEnd: "https://i.postimg.cc/90P3XLp7/Whats-App-Image-2026-11-10-at-00-31-33.jpg"
  },
  {
    id: "l_sit_sbarra",
    name: "L-Sit Sbarra",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/d3YXf8YZ/Whats-App-Image-2026-11-10-at-00-33-56.jpg",
    imgEnd: "https://i.postimg.cc/d3YXf8YZ/Whats-App-Image-2026-11-10-at-00-33-56.jpg"
  },
  {
    id: "l_sit_anelli",
    name: "L-Sit Anelli",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/d3YXf8YT/Whats-App-Image-2026-11-10-at-00-35-09.jpg",
    imgEnd: "https://i.postimg.cc/d3YXf8YT/Whats-App-Image-2026-11-10-at-00-35-09.jpg"
  },
  {
    id: "ab_wheel_rollout",
    name: "Ab Wheel Rollout",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Ab_Roller/0.jpg`,
    imgEnd: `${BASE_IMG}/Ab_Roller/1.jpg`
  },
  {
    id: "trx_body_saw",
    name: "TRX Body Saw",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/zvrMQnrL/Whats-App-Image-2026-11-10-at-00-36-14.jpg",
    imgEnd: "https://i.postimg.cc/zvrMQnrL/Whats-App-Image-2026-11-10-at-00-36-14.jpg"
  },
  {
    id: "trx_knee_tuck",
    name: "TRX Knee Tuck",
    muscle: "Addome",
    imgStart: "https://i.postimg.cc/rsMnjM1g/Whats-App-Image-2026-11-10-at-00-36-57.jpg",
    imgEnd: "https://i.postimg.cc/rsMnjM1g/Whats-App-Image-2026-11-10-at-00-36-57.jpg"
  },
  {
    id: "fitball_crunch",
    name: "Fitball Crunch",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Exercise_Ball_Crunch/0.jpg`,
    imgEnd: `${BASE_IMG}/Exercise_Ball_Crunch/1.jpg`
  },
  {
    id: "back_extension_isometrica",
    name: "Back Extension Isometrica",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Hyperextensions_Back_Extensions/0.jpg`,
    imgEnd: `${BASE_IMG}/Hyperextensions_Back_Extensions/1.jpg`
  },
  {
    id: "suitcase_carry",
    name: "Suitcase Carry",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Farmers_Walk/0.jpg`,
    imgEnd: `${BASE_IMG}/Farmers_Walk/1.jpg`
  },
  {
    id: "overhead_carry",
    name: "Overhead Carry",
    muscle: "Addome",
    imgStart: `${BASE_IMG}/Standing_Dumbbell_Press/1.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Dumbbell_Press/1.jpg`
  },

  // ==========================================
  // --- SKILL & CORPO LIBERO ---
  // ==========================================
  {
    id: "bar_muscle_up",
    name: "Bar Muscle-Up",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/mkBXjBYj/Whats-App-Image-2026-11-10-at-00-39-54.jpg",
    imgEnd: "https://i.postimg.cc/mkBXjBYj/Whats-App-Image-2026-11-10-at-00-39-54.jpg"
  },
  {
    id: "bar_muscle_up_zavorrato",
    name: "Bar Muscle-Up Zavorrato",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/mkBXjBYj/Whats-App-Image-2026-11-10-at-00-39-54.jpg",
    imgEnd: "https://i.postimg.cc/mkBXjBYj/Whats-App-Image-2026-11-10-at-00-39-54.jpg"
  },
  {
    id: "bar_muscle_up_elastico",
    name: "Bar Muscle-Up con Elastico",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/W4Z5PhSm/Whats-App-Image-2026-11-10-at-00-42-02.jpg",
    imgEnd: "https://i.postimg.cc/W4Z5PhSm/Whats-App-Image-2026-11-10-at-00-42-02.jpg"
  },
  {
    id: "ring_muscle_up",
    name: "Ring Muscle-Up",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/0NSVqbZY/Whats-App-Image-2026-11-10-at-00-42-46.jpg",
    imgEnd: "https://i.postimg.cc/0NSVqbZY/Whats-App-Image-2026-11-10-at-00-42-46.jpg"
  },
  {
    id: "ring_muscle_up_assistito",
    name: "Ring Muscle-Up Assistito",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/0NSVqbZY/Whats-App-Image-2026-11-10-at-00-42-46.jpg",
    imgEnd: "https://i.postimg.cc/0NSVqbZY/Whats-App-Image-2026-11-10-at-00-42-46.jpg"
  },
  {
    id: "handstand_muro",
    name: "Handstand al Muro",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/FHdZj7M2/Whats-App-Image-2026-11-10-at-00-44-29.jpg",
    imgEnd: "https://i.postimg.cc/FHdZj7M2/Whats-App-Image-2026-11-10-at-00-44-29.jpg"
  },
  {
    id: "handstand_libera",
    name: "Handstand",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/Hkc2QVqN/Whats-App-Image-2026-11-10-at-00-45-42.jpg",
    imgEnd: "https://i.postimg.cc/Hkc2QVqN/Whats-App-Image-2026-11-10-at-00-45-42.jpg"
  },
  {
    id: "handstand_push_up",
    name: "Handstand Push-Up",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/Sx2rWJBv/Whats-App-Image-2026-11-10-at-00-46-05.jpg",
    imgEnd: "https://i.postimg.cc/Sx2rWJBv/Whats-App-Image-2026-11-10-at-00-46-05.jpg"
  },
  {
    id: "pike_push_up",
    name: "Pike Push-Up",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/NMgmPMn1/Whats-App-Image-2026-11-10-at-00-46-40.jpg",
    imgEnd: "https://i.postimg.cc/NMgmPMn1/Whats-App-Image-2026-11-10-at-00-46-40.jpg"
  },
  {
    id: "elevated_pike_push_up",
    name: "Elevated Pike Push-Up",
    muscle: "Skill",
    imgStart: "https://i.postimg.cc/bJzkFJ51/Whats-App-Image-2026-11-10-at-00-47-26.jpg",
    imgEnd: "https://i.postimg.cc/bJzkFJ51/Whats-App-Image-2026-11-10-at-00-47-26.jpg"
  },

  // ==========================================
  // --- CARDIO MACCHINE ---
  // ==========================================
  {
    id: "row_erg",
    name: "RowErg – Vogatore",
    muscle: "Cardio",
    imgStart: `${BASE_IMG}/Rowing_Stationary/0.jpg`,
    imgEnd: `${BASE_IMG}/Rowing_Stationary/1.jpg`
  },
  {
    id: "skierg",
    name: "SkiErg",
    muscle: "Cardio",
    imgStart: "https://i.postimg.cc/brSJ6fpK/Whats-App-Image-2026-11-10-at-00-48-31.jpg",
    imgEnd: "https://i.postimg.cc/brSJ6fpK/Whats-App-Image-2026-11-10-at-00-48-31.jpg"
  },
  {
    id: "air_bike",
    name: "Air Bike",
    muscle: "Cardio",
    imgStart: "https://i.postimg.cc/7hJ6Brq8/Whats-App-Image-2026-11-10-at-00-49-17.jpg",
    imgEnd: "https://i.postimg.cc/7hJ6Brq8/Whats-App-Image-2026-11-10-at-00-49-17.jpg"
  },
  {
    id: "bike_erg",
    name: "BikeErg",
    muscle: "Cardio",
    imgStart: "https://i.postimg.cc/7hJ6Brqv/Whats-App-Image-2026-11-10-at-00-50-20.jpg",
    imgEnd: "https://i.postimg.cc/7hJ6Brqv/Whats-App-Image-2026-11-10-at-00-50-20.jpg"
  },
  {
    id: "cyclette",
    name: "Cyclette",
    muscle: "Cardio",
    imgStart: "https://i.postimg.cc/9FGTVyj9/Whats-App-Image-2026-11-10-at-00-50-59.jpg",
    imgEnd: "https://i.postimg.cc/9FGTVyj9/Whats-App-Image-2026-11-10-at-00-50-59.jpg"
  },
  {
    id: "ellittica",
    name: "Ellittica",
    muscle: "Cardio",
    imgStart: "https://i.postimg.cc/ncv7Zqt7/Whats-App-Image-2026-11-10-at-00-52-18.jpg",
    imgEnd: "https://i.postimg.cc/ncv7Zqt7/Whats-App-Image-2026-11-10-at-00-52-18.jpg"
  },
  {
    id: "tapis_roulant",
    name: "Tapis Roulant",
    muscle: "Cardio",
    imgStart: `${BASE_IMG}/Running_Treadmill/0.jpg`,
    imgEnd: `${BASE_IMG}/Running_Treadmill/1.jpg`
  },

  // ==========================================
  // --- PETTO (Precedentemente integrati) ---
  // ==========================================
  {
    id: "chest_press_orizzontale",
    name: "Chest Press Orizzontale",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/2yQfMLYp/Whats-App-Image-2026-11-09-at-22-53-27.jpg",
    imgEnd: "https://i.postimg.cc/2yQfMLYp/Whats-App-Image-2026-11-09-at-22-53-27.jpg"
  },
  {
    id: "incline_chest_press_30",
    name: "Incline Chest Press 30°",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/4y6TqHgr/Whats-App-Image-2026-11-09-at-22-55-12.jpg",
    imgEnd: "https://i.postimg.cc/4y6TqHgr/Whats-App-Image-2026-11-09-at-22-55-12.jpg"
  },
  {
    id: "incline_chest_press_45",
    name: "Incline Chest Press 45°",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/4y6TqHgr/Whats-App-Image-2026-11-09-at-22-55-12.jpg",
    imgEnd: "https://i.postimg.cc/4y6TqHgr/Whats-App-Image-2026-11-09-at-22-55-12.jpg"
  },
  {
    id: "decline_chest_press",
    name: "Decline Chest Press",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Decline_Dumbbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_Dumbbell_Bench_Press/1.jpg`
  },
  {
    id: "pec_fly_machine",
    name: "Pec Fly Machine",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Butterfly/1.jpg`,
    imgEnd: `${BASE_IMG}/Butterfly/0.jpg`
  },
  {
    id: "panca_piana_bilanciere",
    name: "Panca Piana Bilanciere",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Bench_Press_-_Medium_Grip/1.jpg`
  },
  {
    id: "panca_inclinata_bilanciere",
    name: "Panca Inclinata Bilanciere",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg`
  },
  {
    id: "panca_declinata_bilanciere",
    name: "Panca Declinata Bilanciere",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Decline_Barbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_Barbell_Bench_Press/1.jpg`
  },
  {
    id: "panca_piana_presa_stretta",
    name: "Panca Piana Presa Stretta",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Close-Grip_Barbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Close-Grip_Barbell_Bench_Press/1.jpg`
  },
  {
    id: "chest_dip_machine",
    name: "Chest Dip Machine",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/XNcmMbFW/Whats-App-Image-2026-11-09-at-22-57-58.jpg",
    imgEnd: "https://i.postimg.cc/XNcmMbFW/Whats-App-Image-2026-11-09-at-22-57-58.jpg"
  },
  {
    id: "floor_press_bilanciere",
    name: "Floor Press Bilanciere",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Floor_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Floor_Press/1.jpg`
  },
  {
    id: "panca_piana_multipower",
    name: "Panca Piana al Multipower",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Smith_Machine_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Bench_Press/1.jpg`
  },
  {
    id: "panca_inclinata_multipower",
    name: "Panca Inclinata al Multipower",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Smith_Machine_Incline_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Incline_Bench_Press/1.jpg`
  },
  {
    id: "panca_declinata_multipower",
    name: "Panca Declinata al Multipower",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/nVC2q7VW/panca-dec-multipower.jpg",
    imgEnd: "https://i.postimg.cc/KcRftLcV/panca-dec-multipower1.png"
  },
  {
    id: "panca_piana_manubri",
    name: "Panca Piana Manubri",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Dumbbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Bench_Press/1.jpg`
  },
  {
    id: "panca_inclinata_manubri",
    name: "Panca Inclinata Manubri",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Incline_Dumbbell_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Incline_Dumbbell_Press/1.jpg`
  },
  {
    id: "panca_declinata_manubri",
    name: "Panca Declinata Manubri",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Decline_Dumbbell_Bench_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_Dumbbell_Bench_Press/1.jpg`
  },
  {
    id: "croci_panca_piana",
    name: "Croci Panca Piana",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Dumbbell_Flyes/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Flyes/1.jpg`
  },
  {
    id: "croci_panca_inclinata",
    name: "Croci Panca Inclinata",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Incline_Dumbbell_Flyes/0.jpg`,
    imgEnd: `${BASE_IMG}/Incline_Dumbbell_Flyes/1.jpg`
  },
  {
    id: "croci_panca_declinata",
    name: "Croci Panca Declinata",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Decline_Dumbbell_Flyes/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_Dumbbell_Flyes/1.jpg`
  },
  {
    id: "floor_press_manubri",
    name: "Floor Press Manubri",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Floor_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Floor_Press/1.jpg`
  },
  {
    id: "pullover_manubrio",
    name: "Pullover Manubrio",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Straight-Arm_Dumbbell_Pullover/0.jpg`,
    imgEnd: `${BASE_IMG}/Straight-Arm_Dumbbell_Pullover/1.jpg`
  },
  {
    id: "croci_cavi_alti",
    name: "Croci ai Cavi Alti",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Cable_Crossover/0.jpg`,
    imgEnd: `${BASE_IMG}/Cable_Crossover/1.jpg`
  },
  {
    id: "croci_cavi_bassi",
    name: "Croci ai Cavi Bassi",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Low_Cable_Crossover/0.jpg`,
    imgEnd: `${BASE_IMG}/Low_Cable_Crossover/1.jpg`
  },
  {
    id: "chest_press_cavi",
    name: "Chest Press ai Cavi",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Standing_Cable_Chest_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Cable_Chest_Press/1.jpg`
  },
  {
    id: "cable_fly_su_panca",
    name: "Cable Fly su Panca",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Incline_Cable_Flye/0.jpg`,
    imgEnd: `${BASE_IMG}/Incline_Cable_Flye/1.jpg`
  },
  {
    id: "push_up_classico",
    name: "Push-Up Classico",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Pushups/0.jpg`,
    imgEnd: `${BASE_IMG}/Pushups/1.jpg`
  },
  {
    id: "push_up_inclinato",
    name: "Push-Up Inclinato",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Incline_Push-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Incline_Push-Up/1.jpg`
  },
  {
    id: "push_up_declinato",
    name: "Push-Up Declinato",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Decline_Push-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Decline_Push-Up/1.jpg`
  },
  {
    id: "push_up_presa_stretta",
    name: "Push-Up Presa Stretta",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/13Mgp2VT/push-up-presa-stretta.png",
    imgEnd: "https://i.postimg.cc/13Mgp2VT/push-up-presa-stretta.png"
  },
  {
    id: "diamond_push_up",
    name: "Diamond Push-Up",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/YCKB5MDy/Diamond-Push-Ups.jpg",
    imgEnd: "https://i.postimg.cc/W1LcBTY9/Diamond-Push-Ups-1.jpg"
  },
  {
    id: "push_up_zavorrato",
    name: "Push-Up Zavorrato",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/Fzr9TsSv/1172.jpg",
    imgEnd: "https://i.postimg.cc/nrFH3cmt/1172(1).jpg"
  },
  {
    id: "deficit_push_up",
    name: "Deficit Push-Up",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/T3zQgy8g/deficit-push.jpg",
    imgEnd: "https://i.postimg.cc/vZJXf1R9/deficit-push1.jpg"
  },
  {
    id: "archer_push_up",
    name: "Archer Push-Up",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/d1xhZyXB/archer.jpg",
    imgEnd: "https://i.postimg.cc/0QBzKw3Z/archer(2).jpg"
  },
  {
    id: "ring_push_up",
    name: "Ring Push-Up",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/SNWc3gHN/ring.jpg",
    imgEnd: "https://i.postimg.cc/15pD2vbR/ring(1).jpg"
  },
  {
    id: "dip_alle_parallele",
    name: "Dip alle Parallele",
    muscle: "Petto",
    imgStart: `${BASE_IMG}/Dips_-_Chest_Version/0.jpg`,
    imgEnd: `${BASE_IMG}/Dips_-_Chest_Version/1.jpg`
  },
  {
    id: "dip_zavorrate",
    name: "Dip Zavorrate",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/htDQwc9N/dip-zavorra.jpg",
    imgEnd: "https://i.postimg.cc/0ykK3PpF/dip-zavorra(1).jpg"
  },
  {
    id: "dip_assistite",
    name: "Dip Assistite",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/VLLYP6Vk/assistita(1).jpg",
    imgEnd: "https://i.postimg.cc/qMMkHR5k/assistita(2).jpg"
  },
  {
    id: "ring_dip",
    name: "Ring Dip",
    muscle: "Petto",
    imgStart: "https://i.postimg.cc/5N0MkrXL/ring-dip.avif",
    imgEnd: "https://i.postimg.cc/5N0MkrXL/ring-dip.avif"
  },

  // ==========================================
  // --- DORSO (Precedentemente integrati) ---
  // ==========================================
  {
    id: "lat_machine_prona",
    name: "Lat Machine Presa Prona",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Wide-Grip_Lat_Pulldown/0.jpg`,
    imgEnd: `${BASE_IMG}/Wide-Grip_Lat_Pulldown/1.jpg`
  },
  {
    id: "lat_machine_supina",
    name: "Lat Machine Presa Supina",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Underhand_Cable_Pulldowns/0.jpg`,
    imgEnd: `${BASE_IMG}/Underhand_Cable_Pulldowns/1.jpg`
  },
  {
    id: "lat_machine_triangolo",
    name: "Lat Machine Triangolo",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/d345hJmv/Whats-App-Image-2026-11-09-at-23-03-19.jpg",
    imgEnd: "https://i.postimg.cc/d345hJmv/Whats-App-Image-2026-11-09-at-23-03-19.jpg"
  },
  {
    id: "lat_machine_unilaterale",
    name: "Lat Machine Unilaterale",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/ZnVwWJFS/Whats-App-Image-2026-11-09-at-23-04-11.jpg",
    imgEnd: "https://i.postimg.cc/ZnVwWJFS/Whats-App-Image-2026-11-09-at-23-04-11.jpg"
  },
  {
    id: "pullover_machine",
    name: "Pullover Machine",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/sDxcnd4Y/Whats-App-Image-2026-11-09-at-23-05-07.jpg",
    imgEnd: "https://i.postimg.cc/sDxcnd4Y/Whats-App-Image-2026-11-09-at-23-05-07.jpg"
  },
  {
    id: "chin_up_machine",
    name: "Chin-Up Machine",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/RVhRP5Lc/Whats-App-Image-2026-11-09-at-23-06-38.jpg",
    imgEnd: "https://i.postimg.cc/RVhRP5Lc/Whats-App-Image-2026-11-09-at-23-06-38.jpg"
  },
  {
    id: "pulley_presa_stretta",
    name: "Pulley Presa Stretta",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "pulley_presa_larga",
    name: "Pulley Presa Larga",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "pulley_presa_neutra",
    name: "Pulley Presa Neutra",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "pulley_presa_supina",
    name: "Pulley Presa Supina",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "pulley_unilaterale",
    name: "Pulley Unilaterale",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "high_row_machine",
    name: "High Row Machine",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/RhNHT9xF/Whats-App-Image-2026-11-09-at-23-09-13.jpg",
    imgEnd: "https://i.postimg.cc/RhNHT9xF/Whats-App-Image-2026-11-09-at-23-09-13.jpg"
  },
  {
    id: "mid_row_machine",
    name: "Mid Row Machine",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/prpFBxMy/Whats-App-Image-2026-11-09-at-23-12-04.jpg",
    imgEnd: "https://i.postimg.cc/prpFBxMy/Whats-App-Image-2026-11-09-at-23-12-04.jpg"
  },
  {
    id: "low_row_machine",
    name: "Low Row Machine",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/XvjX83wW/Whats-App-Image-2026-11-09-at-23-13-36.jpg",
    imgEnd: "https://i.postimg.cc/XvjX83wW/Whats-App-Image-2026-11-09-at-23-13-36.jpg"
  },
  {
    id: "t_bar_row_appoggio",
    name: "T-Bar Row con Appoggio",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/rpVzJcSL/Whats-App-Image-2026-11-09-at-23-14-40.jpg",
    imgEnd: "https://i.postimg.cc/rpVzJcSL/Whats-App-Image-2026-11-09-at-23-14-40.jpg"
  },
  {
    id: "t_bar_row_senza_appoggio",
    name: "T-Bar Row Senza Appoggio",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/T-Bar_Row_with_Handle/0.jpg`,
    imgEnd: `${BASE_IMG}/T-Bar_Row_with_Handle/1.jpg`
  },
  {
    id: "seated_row",
    name: "Seated Row",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/cJxBPvqW/Whats-App-Image-2026-11-09-at-23-15-54.jpg",
    imgEnd: "https://i.postimg.cc/cJxBPvqW/Whats-App-Image-2026-11-09-at-23-15-54.jpg"
  },
  {
    id: "rematore_bilanciere_prona",
    name: "Rematore Bilanciere Presa Prona",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Bent_Over_Barbell_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Bent_Over_Barbell_Row/1.jpg`
  },
  {
    id: "rematore_bilanciere_supina",
    name: "Rematore Bilanciere Presa Supina",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/fbzf1V4N/Whats-App-Image-2026-11-09-at-23-16-45.jpg",
    imgEnd: "https://i.postimg.cc/fbzf1V4N/Whats-App-Image-2026-11-09-at-23-16-45.jpg"
  },
  {
    id: "pendlay_row",
    name: "Pendlay Row",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/pL2jL3sR/Whats-App-Image-2026-11-09-at-23-17-52.jpg",
    imgEnd: "https://i.postimg.cc/pL2jL3sR/Whats-App-Image-2026-11-09-at-23-17-52.jpg"
  },
  {
    id: "rematore_manubrio_unilaterale",
    name: "Rematore Manubrio Unilaterale",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/One-Arm_Dumbbell_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/One-Arm_Dumbbell_Row/1.jpg`
  },
  {
    id: "rematore_due_manubri",
    name: "Rematore Due Manubri",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Bent_Over_Two-Dumbbell_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Bent_Over_Two-Dumbbell_Row/1.jpg`
  },
  {
    id: "rematore_manubri_panca_inclinata",
    name: "Rematore Manubri su Panca Inclinata",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/9QW9QsLV/Whats-App-Image-2026-11-09-at-23-19-05.jpg",
    imgEnd: "https://i.postimg.cc/9QW9QsLV/Whats-App-Image-2026-11-09-at-23-19-05.jpg"
  },
  {
    id: "rematore_manubri_gomiti_larghi",
    name: "Rematore Manubri Gomiti Larghi",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Bent_Over_Two-Dumbbell_Row_With_Palms_In/0.jpg`,
    imgEnd: `${BASE_IMG}/Bent_Over_Two-Dumbbell_Row_With_Palms_In/1.jpg`
  },
  {
    id: "renegade_row",
    name: "Renegade Row",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/cJP6wzBm/Whats-App-Image-2026-11-09-at-23-20-25.jpg",
    imgEnd: "https://i.postimg.cc/cJP6wzBm/Whats-App-Image-2026-11-09-at-23-20-25.jpg"
  },
  {
    id: "dumbbell_pullover",
    name: "Dumbbell Pullover",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Straight-Arm_Dumbbell_Pullover/0.jpg`,
    imgEnd: `${BASE_IMG}/Straight-Arm_Dumbbell_Pullover/1.jpg`
  },
  {
    id: "lat_pulldown_unilaterale_cavo",
    name: "Lat Pulldown Unilaterale al Cavo",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/nLNMBWGG/Whats-App-Image-2026-11-09-at-23-22-23.jpg",
    imgEnd: "https://i.postimg.cc/nLNMBWGG/Whats-App-Image-2026-11-09-at-23-22-23.jpg"
  },
  {
    id: "pulldown_braccia_tese",
    name: "Pulldown Braccia Tese",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Straight-Arm_Pulldown/0.jpg`,
    imgEnd: `${BASE_IMG}/Straight-Arm_Pulldown/1.jpg`
  },
  {
    id: "pullover_al_cavo",
    name: "Pullover al Cavo",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/fyDzvQt7/Whats-App-Image-2026-11-09-at-23-23-34.jpg",
    imgEnd: "https://i.postimg.cc/fyDzvQt7/Whats-App-Image-2026-11-09-at-23-23-34.jpg"
  },
  {
    id: "rematore_unilaterale_cavo",
    name: "Rematore Unilaterale al Cavo",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/gjmzKbXR/Whats-App-Image-2026-11-09-at-23-24-48.jpg",
    imgEnd: "https://i.postimg.cc/gjmzKbXR/Whats-App-Image-2026-11-09-at-23-24-48.jpg"
  },
  {
    id: "rematore_bilaterale_cavi",
    name: "Rematore Bilaterale ai Cavi",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "high_cable_row",
    name: "High Cable Row",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/mgvGwWKs/Whats-App-Image-2026-11-09-at-23-25-58.jpg",
    imgEnd: "https://i.postimg.cc/mgvGwWKs/Whats-App-Image-2026-11-09-at-23-25-58.jpg"
  },
  {
    id: "low_cable_row",
    name: "Low Cable Row",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Seated_Cable_Rows/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Cable_Rows/1.jpg`
  },
  {
    id: "face_pull",
    name: "Face Pull",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Face_Pull/0.jpg`,
    imgEnd: `${BASE_IMG}/Face_Pull/1.jpg`
  },
  {
    id: "pull_up_prona",
    name: "Pull-Up Presa Prona",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Pullups/0.jpg`,
    imgEnd: `${BASE_IMG}/Pullups/1.jpg`
  },
  {
    id: "pull_up_neutra",
    name: "Pull-Up Presa Neutra",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/t4KH5G8H/Whats-App-Image-2026-11-09-at-23-26-57.jpg",
    imgEnd: "https://i.postimg.cc/t4KH5G8H/Whats-App-Image-2026-11-09-at-23-26-57.jpg"
  },
  {
    id: "chin_up",
    name: "Chin-Up",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/j259TMBZ/Whats-App-Image-2026-11-09-at-23-27-57.jpg",
    imgEnd: "https://i.postimg.cc/j259TMBZ/Whats-App-Image-2026-11-09-at-23-27-57.jpg"
  },
  {
    id: "pull_up_larga",
    name: "Pull-Up Presa Larga",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Wide-Grip_Rear_Pull-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Wide-Grip_Rear_Pull-Up/1.jpg`
  },
  {
    id: "chest_to_bar_pull_up",
    name: "Chest-to-Bar Pull-Up",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/4ydMGWjw/Whats-App-Image-2026-11-09-at-23-28-52.jpg",
    imgEnd: "https://i.postimg.cc/4ydMGWjw/Whats-App-Image-2026-11-09-at-23-28-52.jpg"
  },
  {
    id: "scapular_pull_up",
    name: "Scapular Pull-Up",
    muscle: "Dorso",
    imgStart: "https://i.postimg.cc/28LcxLYt/Whats-App-Image-2026-11-09-at-23-31-15.jpg",
    imgEnd: "https://i.postimg.cc/28LcxLYt/Whats-App-Image-2026-11-09-at-23-31-15.jpg"
  },
  {
    id: "australian_pull_up",
    name: "Australian Pull-Up",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Inverted_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Inverted_Row/1.jpg`
  },
  {
    id: "ring_row",
    name: "Ring Row",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Inverted_Row/0.jpg`,
    imgEnd: `${BASE_IMG}/Inverted_Row/1.jpg`
  },
  {
    id: "ring_pull_up",
    name: "Ring Pull-Up",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Pullups/0.jpg`,
    imgEnd: `${BASE_IMG}/Pullups/1.jpg`
  },
  {
    id: "ring_chin_up",
    name: "Ring Chin-Up",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Chin-Up/0.jpg`,
    imgEnd: `${BASE_IMG}/Chin-Up/1.jpg`
  },
  {
    id: "dead_hang",
    name: "Dead Hang",
    muscle: "Dorso",
    imgStart: `${BASE_IMG}/Pullups/0.jpg`,
    imgEnd: `${BASE_IMG}/Pullups/0.jpg`
  },

  // ==========================================
  // --- GAMBE & GLUTEI (Precedentemente integrati) ---
  // ==========================================
  {
    id: "hack_squat",
    name: "Hack Squat",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Hack_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Hack_Squat/1.jpg`
  },
  {
    id: "leg_press_orizzontale",
    name: "Leg Press Orizzontale",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/3Rj0qWqY/legpressorizzontale.jpg",
    imgEnd: "https://i.postimg.cc/3Rj0qWqY/legpressorizzontale.jpg"
  },
  {
    id: "leg_press_45",
    name: "Leg Press 45°",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Leg_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Leg_Press/1.jpg`
  },
  {
    id: "leg_press_monopodalica",
    name: "Leg Press Monopodalica",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/yNjzrHTb/Leg-press-monopodalica.jpg",
    imgEnd: "https://i.postimg.cc/yNjzrHTb/Leg-press-monopodalica.jpg"
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Leg_Extensions/0.jpg`,
    imgEnd: `${BASE_IMG}/Leg_Extensions/1.jpg`
  },
  {
    id: "leg_extension_monopodalica",
    name: "Leg Extension Monopodalica",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/JhP95Qrw/Leg-Extension-Monopodalica.jpg",
    imgEnd: "https://i.postimg.cc/JhP95Qrw/Leg-Extension-Monopodalica.jpg"
  },
  {
    id: "pendulum_squat",
    name: "Pendulum Squat",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/Kzvw93Hs/Whats-App-Image-2026-11-09-at-22-43-29.jpg",
    imgEnd: "https://i.postimg.cc/SsN3ZYv1/Whats-App-Image-2026-11-09-at-22-43-29(1).jpg"
  },
  {
    id: "belt_squat",
    name: "Belt Squat",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/SKdWqyL1/Belt-Squat.jpg",
    imgEnd: "https://i.postimg.cc/xd5KY0Gs/Belt-Squat1.jpg"
  },
  {
    id: "hip_thrust_machine",
    name: "Hip Thrust Machine",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/fRxjchGd/11d8da2d-c8aa-4b1c-902e-a3d9d9151af7.jpg",
    imgEnd: "https://i.postimg.cc/fRxjchGd/11d8da2d-c8aa-4b1c-902e-a3d9d9151af7.jpg"
  },
  {
    id: "glute_kickback_machine",
    name: "Glute Kick Back Machine",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/ZY94ZXwM/Whats-App-Image-2026-11-09-at-22-47-16.jpg",
    imgEnd: "https://i.postimg.cc/ZY94ZXwM/Whats-App-Image-2026-11-09-at-22-47-16.jpg"
  },
  {
    id: "gluteus_machine",
    name: "Gluteus Machine",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/pdSy1zC4/Gluteus-Machine0.jpg",
    imgEnd: "https://i.postimg.cc/d0fDSr6f/Gluteus-Machine1.jpg"
  },
  {
    id: "adductor",
    name: "Adductor Machine",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/jj1CkPc8/Adductor-Machine0.jpg",
    imgEnd: "https://i.postimg.cc/KYW4sBfp/Adductor-Machine1.jpg"
  },
  {
    id: "abductor",
    name: "Abductor Machine",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/YSPjyYRd/Abductor-Machine0.jpg",
    imgEnd: "https://i.postimg.cc/1zd4YwBY/Abductor-Machine1.jpg"
  },
  {
    id: "leg_curl_seduto",
    name: "Leg Curl Seduto",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Seated_Leg_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Leg_Curl/1.jpg`
  },
  {
    id: "leg_curl_monopodalico",
    name: "Leg Curl Monopodalico",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/jSLb39F9/Leg-Curl-Monopodalico.avif",
    imgEnd: "https://i.postimg.cc/jSLb39F9/Leg-Curl-Monopodalico.avif"
  },
  {
    id: "leg_curl_sdraiato",
    name: "Leg Curl Sdraiato",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Lying_Leg_Curls/0.jpg`,
    imgEnd: `${BASE_IMG}/Lying_Leg_Curls/1.jpg`
  },
  {
    id: "leg_curl_in_piedi",
    name: "Leg Curl in Piedi",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Standing_Leg_Curl/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Leg_Curl/1.jpg`
  },
  {
    id: "standing_calf_raise_machine",
    name: "Standing Calf Raise Machine",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Standing_Calf_Raises/0.jpg`,
    imgEnd: `${BASE_IMG}/Standing_Calf_Raises/1.jpg`
  },
  {
    id: "seated_calf_raise_machine",
    name: "Seated Calf Raise Machine",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Seated_Calf_Raise/0.jpg`,
    imgEnd: `${BASE_IMG}/Seated_Calf_Raise/1.jpg`
  },
  {
    id: "back_squat",
    name: "Back Squat",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Barbell_Full_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Full_Squat/1.jpg`
  },
  {
    id: "front_squat",
    name: "Front Squat",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Front_Barbell_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Front_Barbell_Squat/1.jpg`
  },
  {
    id: "box_squat",
    name: "Box Squat",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Box_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Box_Squat/1.jpg`
  },
  {
    id: "pin_squat",
    name: "Pin Squat",
    muscle: "Gambe",
    imgStart: `https://i.postimg.cc/L8ZW1M7h/Pin-Squat.jpg`,
    imgEnd: `https://i.postimg.cc/L8ZW1M7h/Pin-Squat.jpg`
  },
  {
    id: "squat_safety_bar",
    name: "Squat Safety Bar",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/fT12Zrb6/safety-bar-squat-800.jpg",
    imgEnd: "https://i.postimg.cc/fT12Zrb6/safety-bar-squat-800.jpg"
  },
  {
    id: "squat_multipower",
    name: "Squat al Multipower",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Smith_Machine_Squat/1.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Squat/0.jpg`
  },
  {
    id: "front_squat_multipower",
    name: "Front Squat al Multipower",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Smith_Machine_Squat/1.jpg`,
    imgEnd: `${BASE_IMG}/Smith_Machine_Squat/0.jpg`
  },
  {
    id: "split_squat_multipower",
    name: "Split Squat al Multipower",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/SstLdn2t/Split-Squat-al-Multipower.png",
    imgEnd: "https://i.postimg.cc/SstLdn2t/Split-Squat-al-Multipower.png"
  },
  {
    id: "squat_bulgaro_multipower",
    name: "Squat Bulgaro al Multipower",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/SstLdn2t/Split-Squat-al-Multipower.png",
    imgEnd: "https://i.postimg.cc/SstLdn2t/Split-Squat-al-Multipower.png"
  },
  {
    id: "sumo_squat_multipower",
    name: "Sumo Squat al Multipower",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Wide_Stance_Barbell_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Wide_Stance_Barbell_Squat/1.jpg`
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/X75k7nX5/goblet-squat-800.jpg",
    imgEnd: "https://i.postimg.cc/X75k7nX5/goblet-squat-800.jpg"
  },
  {
    id: "squat_manubri",
    name: "Squat Manubri",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Dumbbell_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Squat/1.jpg`
  },
  {
    id: "sumo_squat_manubrio",
    name: "Sumo Squat Manubrio",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Goblet_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Goblet_Squat/1.jpg`
  },
  {
    id: "squat_bulgaro_manubri",
    name: "Squat Bulgaro Manubri",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/KY8TLbcn/squabulgaromanubri0.jpg",
    imgEnd: "https://i.postimg.cc/BvnFD3ZH/squabulgaromanubri1.jpg"
  },
  {
    id: "affondi_avanti_manubri",
    name: "Affondi Avanti con Manubri",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Dumbbell_Lunges/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Lunges/1.jpg`
  },
  {
    id: "affondi_indietro_manubri",
    name: "Affondi Indietro con Manubri",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Dumbbell_Rear_Lunge/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Rear_Lunge/1.jpg`
  },
  {
    id: "affondi_laterali_manubri",
    name: "Affondi Laterali con Manubri",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/7hwwSX3F/affondi-laterali-1.png",
    imgEnd: "https://i.postimg.cc/xd8k8Pgm/Affondi-Laterali-con-Manubri.jpg"
  },
  {
    id: "affondi_incrociati",
    name: "Affondi Incrociati",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/VN0Y2ZDp/Affondi-incrociati.jpg",
    imgEnd: "https://i.postimg.cc/bvSz4V35/Affondi-incrociati1.jpg"
  },
  {
    id: "step_up",
    name: "Step Up",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Dumbbell_Step_Ups/1.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Step_Ups/0.jpg`
  },
  {
    id: "pistol_squat",
    name: "Pistol Squat",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/pLhbdhzv/pistol-squat.jpg",
    imgEnd: "https://i.postimg.cc/JzDVhDZL/pistol-squat1.jpg"
  },
  {
    id: "kettlebell_sumo_squat",
    name: "Kettlebell Sumo Squat",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Goblet_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Goblet_Squat/1.jpg`
  },
  {
    id: "stacco_da_terra",
    name: "Stacco da Terra",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Barbell_Deadlift/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Deadlift/1.jpg`
  },
  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift Bilanciere/Manubri",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Romanian_Deadlift/0.jpg`,
    imgEnd: `${BASE_IMG}/Romanian_Deadlift/1.jpg`
  },
  {
    id: "stacco_rumeno_monopodalico",
    name: "Stacco Rumeno Monopodalico",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Romanian_Deadlift/0.jpg`,
    imgEnd: `${BASE_IMG}/Romanian_Deadlift/1.jpg`
  },
  {
    id: "stacco_rumeno_multipower",
    name: "Stacco Rumeno al Multipower",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/7YjtmBJk/stacco-rumeno-mono.avif",
    imgEnd: "https://i.postimg.cc/7YjtmBJk/stacco-rumeno-mono.avif"
  },
  {
    id: "deficit_deadlift",
    name: "Deficit Deadlift",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/YSM3sTr0/deficit-deadlift.png",
    imgEnd: "https://i.postimg.cc/YSM3sTr0/deficit-deadlift.png"
  },
  {
    id: "stacco_gambe_tese",
    name: "Stacco Gambe Tese",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
    imgEnd: `${BASE_IMG}/Stiff-Legged_Barbell_Deadlift/1.jpg`
  },
  {
    id: "trap_bar",
    name: "Stacco Trap Bar",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/9XZBcWD7/Stacco-Trap-Bar.jpg",
    imgEnd: "https://i.postimg.cc/qByGpkNC/Stacco-Trap-Bar(1).jpg"
  },
  {
    id: "good_morning_bilanciere",
    name: "Good Morning Bilanciere",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Good_Morning/0.jpg`,
    imgEnd: `${BASE_IMG}/Good_Morning/1.jpg`
  },
  {
    id: "pull_through",
    name: "Pull Through",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/1tc4YYzm/Pull-Through-gambe.jpg",
    imgEnd: "https://i.postimg.cc/sX91002y/Pull-Through-gambe1.jpg"
  },
  {
    id: "kettlebell_deadlift",
    name: "Kettlebell Deadlift",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/5yhGYpwH/Kettlebell-Stacco.jpg",
    imgEnd: "https://i.postimg.cc/yxM5gnFg/Kettlebell-Stacco1.jpg"
  },
  {
    id: "kettlebell_swing",
    name: "Kettlebell Swing",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/KjDqjFvP/Kettlebell-Swing.png",
    imgEnd: "https://i.postimg.cc/KjDqjFvn/Kettlebell-Swing-1.png"
  },
  {
    id: "back_extension_45",
    name: "Back Extension 45°",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Hyperextensions_Back_Extensions/0.jpg`,
    imgEnd: `${BASE_IMG}/Hyperextensions_Back_Extensions/1.jpg`
  },
  {
    id: "hip_thrust_bilanciere",
    name: "Hip Thrust Bilanciere",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Barbell_Hip_Thrust/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Hip_Thrust/1.jpg`
  },
  {
    id: "hip_thrust_multipower",
    name: "Hip Thrust Multipower",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Barbell_Hip_Thrust/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Hip_Thrust/1.jpg`
  },
  {
    id: "hip_thrust_monopodalico",
    name: "Hip Thrust Monopodalico",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/nz09hPfG/Hip-Thrust-Monopodalico.jpg",
    imgEnd: "https://i.postimg.cc/xCtN14VG/Hip-Thrust-Monopodalico1.jpg"
  },
  {
    id: "kickback_al_cavo_glutei",
    name: "Kickback al Cavo (Glutei)",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/yddYv62S/back-al-cavo.jpg",
    imgEnd: "https://i.postimg.cc/yddYv62S/back-al-cavo.jpg"
  },
  {
    id: "abduzione_al_cavo",
    name: "Abduzione al Cavo",
    muscle: "Gambe",
    imgStart: `${BASE_IMG}/Glute_Kickback/0.jpg`,
    imgEnd: `${BASE_IMG}/Glute_Kickback/1.jpg`
  },
  {
    id: "adduzione_al_cavo",
    name: "Adduzione al Cavo",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/SQYzhVtL/Abduzionealcavo.jpg",
    imgEnd: "https://i.postimg.cc/SQYzhVtL/Abduzionealcavo.jpg"
  },
  {
    id: "lateral_band_walk",
    name: "Lateral Band Walk",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/vZ0m96Ns/Lateral-Band-Walk.webp",
    imgEnd: "https://i.postimg.cc/vZ0m96Ns/Lateral-Band-Walk.webp"
  },
  {
    id: "calf_raise_step",
    name: "Calf Raise Step",
    muscle: "Gambe",
    imgStart: "https://i.postimg.cc/4yPDMptg/Calfraisestep.jpg",
    imgEnd: "https://i.postimg.cc/4yPDMptg/Calfraisestep.jpg"
  },
  // ==========================================
  // --- FUNZIONALI ---
  // ==========================================
  {
    id: "sled_push",
    name: "Sled Push",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/PfDvz1JR/Whats-App-Image-2026-11-10-at-00-53-56.jpg",
    imgEnd: "https://i.postimg.cc/PfDvz1JR/Whats-App-Image-2026-11-10-at-00-53-56.jpg"
  },
  {
    id: "sled_pull",
    name: "Sled Pull",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/XN5Bc9qm/Whats-App-Image-2026-11-10-at-00-55-25.jpg",
    imgEnd: "https://i.postimg.cc/XN5Bc9qm/Whats-App-Image-2026-11-10-at-00-55-25.jpg"
  },
  {
    id: "sled_drag_indietro",
    name: "Sled Drag all'Indietro",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/BbCq7SdZ/Whats-App-Image-2026-11-10-at-00-56-50.jpg",
    imgEnd: "https://i.postimg.cc/BbCq7SdZ/Whats-App-Image-2026-11-10-at-00-56-50.jpg"
  },
  {
    id: "sled_drag_avanti",
    name: "Sled Drag in Avanti",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/9X9wty0k/Whats-App-Image-2026-11-10-at-00-56-40.jpg",
    imgEnd: "https://i.postimg.cc/9X9wty0k/Whats-App-Image-2026-11-10-at-00-56-40.jpg"
  },
  {
    id: "farmer_carry",
    name: "Farmer Carry",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Farmers_Walk/0.jpg`,
    imgEnd: `${BASE_IMG}/Farmers_Walk/1.jpg`
  },
  {
    id: "suitcase_carry_kettlebell",
    name: "Suitcase Carry Kettlebell",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Farmers_Walk/0.jpg`,
    imgEnd: `${BASE_IMG}/Farmers_Walk/1.jpg`
  },
  {
    id: "walking_lunge_sandbag",
    name: "Walking Lunge con Sandbag",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/MHYW36hW/Whats-App-Image-2026-11-10-at-00-59-14.jpg",
    imgEnd: "https://i.postimg.cc/MHYW36hW/Whats-App-Image-2026-11-10-at-00-59-14.jpg"
  },
  {
    id: "box_jump",
    name: "Box Jump",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/HntpvYfY/Whats-App-Image-2026-11-10-at-01-00-12.jpg",
    imgEnd: "https://i.postimg.cc/HntpvYfY/Whats-App-Image-2026-11-10-at-01-00-12.jpg"
  },
  {
    id: "box_step_up",
    name: "Box Step-Up",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Dumbbell_Step_Ups/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Step_Ups/1.jpg`
  },
  {
    id: "lateral_box_jump",
    name: "Lateral Box Jump",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/rFFcFLBm/Whats-App-Image-2026-11-10-at-01-01-34.jpg",
    imgEnd: "https://i.postimg.cc/rFFcFLBm/Whats-App-Image-2026-11-10-at-01-01-34.jpg"
  },
  {
    id: "broad_jump",
    name: "Broad Jump",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/jddKdrp2/Whats-App-Image-2026-11-10-at-01-02-34.jpg",
    imgEnd: "https://i.postimg.cc/jddKdrp2/Whats-App-Image-2026-11-10-at-01-02-34.jpg"
  },
  {
    id: "squat_jump",
    name: "Squat Jump",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/MKKxK8Cp/Whats-App-Image-2026-11-10-at-01-03-08.jpg",
    imgEnd: "https://i.postimg.cc/MKKxK8Cp/Whats-App-Image-2026-11-10-at-01-03-08.jpg"
  },
  {
    id: "skater_jump",
    name: "Skater Jump",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/wBDnQfK9/Whats-App-Image-2026-11-10-at-01-03-57.jpg",
    imgEnd: "https://i.postimg.cc/wBDnQfK9/Whats-App-Image-2026-11-10-at-01-03-57.jpg"
  },
  {
    id: "jumping_lunge",
    name: "Jumping Lunge",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/pdK3JGN2/Whats-App-Image-2026-11-10-at-01-04-51.jpg",
    imgEnd: "https://i.postimg.cc/pdK3JGN2/Whats-App-Image-2026-11-10-at-01-04-51.jpg"
  },
  {
    id: "jumping_jack",
    name: "Jumping Jack",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/VNX2WGym/Whats-App-Image-2026-11-10-at-01-05-36.jpg",
    imgEnd: "https://i.postimg.cc/VNX2WGym/Whats-App-Image-2026-11-10-at-01-05-36.jpg"
  },
  {
    id: "high_knees",
    name: "High Knees",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/6qPHXnsF/Whats-App-Image-2026-11-10-at-01-06-22.jpg",
    imgEnd: "https://i.postimg.cc/6qPHXnsF/Whats-App-Image-2026-11-10-at-01-06-22.jpg"
  },
  {
    id: "burpee",
    name: "Burpee",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/Fz6P43t2/Whats-App-Image-2026-11-10-at-01-07-41.jpg",
    imgEnd: "https://i.postimg.cc/Fz6P43t2/Whats-App-Image-2026-11-10-at-01-07-41.jpg"
  },
  {
    id: "american_kettlebell_swing",
    name: "American Kettlebell Swing",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/Wzy9vgRB/Whats-App-Image-2026-11-10-at-01-08-26.jpg",
    imgEnd: "https://i.postimg.cc/Wzy9vgRB/Whats-App-Image-2026-11-10-at-01-08-26.jpg"
  },
  {
    id: "single_arm_kettlebell_swing",
    name: "Single Arm Kettlebell Swing",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/One-Arm_Kettlebell_Swings/0.jpg`,
    imgEnd: `${BASE_IMG}/One-Arm_Kettlebell_Swings/1.jpg`
  },
  {
    id: "double_kettlebell_swing",
    name: "Double Kettlebell Swing",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/WpyStGKy/Whats-App-Image-2026-11-10-at-01-09-21.jpg",
    imgEnd: "https://i.postimg.cc/WpyStGKy/Whats-App-Image-2026-11-10-at-01-09-21.jpg"
  },
  {
    id: "kettlebell_clean",
    name: "Kettlebell Clean",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/c1zT6Rj9/Whats-App-Image-2026-11-10-at-01-10-15.jpg",
    imgEnd: "https://i.postimg.cc/c1zT6Rj9/Whats-App-Image-2026-11-10-at-01-10-15.jpg"
  },
  {
    id: "kettlebell_snatch",
    name: "Kettlebell Snatch",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/ryHgz1bg/Whats-App-Image-2026-11-10-at-01-10-58.jpg",
    imgEnd: "https://i.postimg.cc/ryHgz1bg/Whats-App-Image-2026-11-10-at-01-10-58.jpg"
  },
  {
    id: "kettlebell_high_pull",
    name: "Kettlebell High Pull",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Kettlebell_Sumo_High_Pull/0.jpg`,
    imgEnd: `${BASE_IMG}/Kettlebell_Sumo_High_Pull/1.jpg`
  },
  {
    id: "kettlebell_thruster",
    name: "Kettlebell Thruster",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/WpxKxc2c/Whats-App-Image-2026-11-10-at-01-11-53.jpg",
    imgEnd: "https://i.postimg.cc/WpxKxc2c/Whats-App-Image-2026-11-10-at-01-11-53.jpg"
  },
  {
    id: "kettlebell_push_press",
    name: "Kettlebell Push Press",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/G36N6ncR/Whats-App-Image-2026-11-10-at-01-12-34.jpg",
    imgEnd: "https://i.postimg.cc/G36N6ncR/Whats-App-Image-2026-11-10-at-01-12-34.jpg"
  },
  {
    id: "kettlebell_windmill",
    name: "Kettlebell Windmill",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Kettlebell_Windmill/0.jpg`,
    imgEnd: `${BASE_IMG}/Kettlebell_Windmill/1.jpg`
  },
  {
    id: "turkish_get_up",
    name: "Turkish Get-Up",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/gc151bYG/Whats-App-Image-2026-11-10-at-01-13-36.jpg",
    imgEnd: "https://i.postimg.cc/gc151bYG/Whats-App-Image-2026-11-10-at-01-13-36.jpg"
  },
  {
    id: "kettlebell_halo",
    name: "Kettlebell Halo",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/zG7xzs1w/Whats-App-Image-2026-11-10-at-01-14-14.jpg",
    imgEnd: "https://i.postimg.cc/zG7xzs1w/Whats-App-Image-2026-11-10-at-01-14-14.jpg"
  },
  {
    id: "kettlebell_bottom_up_press",
    name: "Kettlebell Bottom-Up Press",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/BnpmSrG2/Whats-App-Image-2026-11-10-at-01-15-05.jpg",
    imgEnd: "https://i.postimg.cc/BnpmSrG2/Whats-App-Image-2026-11-10-at-01-15-05.jpg"
  },
  {
    id: "double_kettlebell_front_squat",
    name: "Double Kettlebell Front Squat",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/3x1t8sHX/Whats-App-Image-2026-11-10-at-01-15-52.jpg",
    imgEnd: "https://i.postimg.cc/3x1t8sHX/Whats-App-Image-2026-11-10-at-01-15-52.jpg"
  },
  {
    id: "dumbbell_snatch",
    name: "Dumbbell Snatch",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/Mp596C8y/Whats-App-Image-2026-11-10-at-01-16-54.jpg",
    imgEnd: "https://i.postimg.cc/Mp596C8y/Whats-App-Image-2026-11-10-at-01-16-54.jpg"
  },
  {
    id: "dumbbell_clean",
    name: "Dumbbell Clean",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/76212cjJ/Whats-App-Image-2026-11-10-at-01-17-40.jpg",
    imgEnd: "https://i.postimg.cc/76212cjJ/Whats-App-Image-2026-11-10-at-01-17-40.jpg"
  },
  {
    id: "dumbbell_hang_clean",
    name: "Dumbbell Hang Clean",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/9M7P7Ssq/Whats-App-Image-2026-11-10-at-01-18-14.jpg",
    imgEnd: "https://i.postimg.cc/9M7P7Ssq/Whats-App-Image-2026-11-10-at-01-18-14.jpg"
  },
  {
    id: "dumbbell_thruster",
    name: "Dumbbell Thruster",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/Pxwbwc0L/Whats-App-Image-2026-11-10-at-01-19-06.jpg",
    imgEnd: "https://i.postimg.cc/Pxwbwc0L/Whats-App-Image-2026-11-10-at-01-19-06.jpg"
  },
  {
    id: "dumbbell_push_press",
    name: "Dumbbell Push Press",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/9F52Z7wQ/Whats-App-Image-2026-11-10-at-01-20-06.jpg",
    imgEnd: "https://i.postimg.cc/9F52Z7wQ/Whats-App-Image-2026-11-10-at-01-20-06.jpg"
  },
  {
    id: "dumbbell_devil_press",
    name: "Dumbbell Devil Press",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/ZKtmpdvK/Whats-App-Image-2026-11-10-at-01-21-16.jpg",
    imgEnd: "https://i.postimg.cc/ZKtmpdvK/Whats-App-Image-2026-11-10-at-01-21-16.jpg"
  },
  {
    id: "dumbbell_ground_to_overhead",
    name: "Dumbbell Ground to Overhead",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/BQ93HKPZ/Whats-App-Image-2026-11-10-at-01-22-20.jpg",
    imgEnd: "https://i.postimg.cc/BQ93HKPZ/Whats-App-Image-2026-11-10-at-01-22-20.jpg"
  },
  {
    id: "power_clean",
    name: "Power Clean",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/CMbXy6dz/Whats-App-Image-2026-11-10-at-01-23-17.jpg",
    imgEnd: "https://i.postimg.cc/CMbXy6dz/Whats-App-Image-2026-11-10-at-01-23-17.jpg"
  },
  {
    id: "hang_power_clean",
    name: "Hang Power Clean",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Hang_Clean/0.jpg`,
    imgEnd: `${BASE_IMG}/Hang_Clean/1.jpg`
  },
  {
    id: "squat_clean",
    name: "Squat Clean",
    muscle: "Funzionali",
    imgStart: "https://i.postimg.cc/v85kRSD4/Whats-App-Image-2026-11-10-at-01-23-57.jpg",
    imgEnd: "https://i.postimg.cc/v85kRSD4/Whats-App-Image-2026-11-10-at-01-23-57.jpg"
  },
  {
    id: "clean_and_jerk",
    name: "Clean and Jerk",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Clean_and_Jerk/0.jpg`,
    imgEnd: `${BASE_IMG}/Clean_and_Jerk/1.jpg`
  },
  {
    id: "power_snatch",
    name: "Power Snatch",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Snatch/0.jpg`,
    imgEnd: `${BASE_IMG}/Snatch/1.jpg`
  },
  {
    id: "hang_power_snatch",
    name: "Hang Power Snatch",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Hang_Snatch/0.jpg`,
    imgEnd: `${BASE_IMG}/Hang_Snatch/1.jpg`
  },
  {
    id: "squat_snatch",
    name: "Squat Snatch",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Snatch/0.jpg`,
    imgEnd: `${BASE_IMG}/Snatch/1.jpg`
  },
  {
    id: "hang_snatch",
    name: "Hang Snatch",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Hang_Snatch/0.jpg`,
    imgEnd: `${BASE_IMG}/Hang_Snatch/1.jpg`
  },
  {
    id: "clean_pull",
    name: "Clean Pull",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Power_Clean/0.jpg`,
    imgEnd: `${BASE_IMG}/Power_Clean/0.jpg`
  },
  {
    id: "snatch_pull",
    name: "Snatch Pull",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Snatch/0.jpg`,
    imgEnd: `${BASE_IMG}/Snatch/0.jpg`
  },
  {
    id: "barbell_thruster",
    name: "Barbell Thruster",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Front_Barbell_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Push_Press/1.jpg`
  },
  {
    id: "wall_ball",
    name: "Wall Ball",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Medicine_Ball_Chest_Pass/0.jpg`,
    imgEnd: `${BASE_IMG}/Medicine_Ball_Chest_Pass/1.jpg`
  },
  {
    id: "medicine_ball_slam",
    name: "Medicine Ball Slam",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Overhead_Slam/0.jpg`,
    imgEnd: `${BASE_IMG}/Overhead_Slam/1.jpg`
  },
  {
    id: "slam_ball_over_shoulder",
    name: "Slam Ball Over Shoulder",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Overhead_Slam/0.jpg`,
    imgEnd: `${BASE_IMG}/Overhead_Slam/1.jpg`
  },
  {
    id: "sandbag_clean",
    name: "Sandbag Clean",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Power_Clean/0.jpg`,
    imgEnd: `${BASE_IMG}/Power_Clean/1.jpg`
  },
  {
    id: "sandbag_squat",
    name: "Sandbag Squat",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Barbell_Full_Squat/0.jpg`,
    imgEnd: `${BASE_IMG}/Barbell_Full_Squat/1.jpg`
  },
  {
    id: "sandbag_thruster",
    name: "Sandbag Thruster",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Push_Press/0.jpg`,
    imgEnd: `${BASE_IMG}/Push_Press/1.jpg`
  },
  {
    id: "sandbag_front_lunge",
    name: "Sandbag Front Lunge",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Dumbbell_Lunges/0.jpg`,
    imgEnd: `${BASE_IMG}/Dumbbell_Lunges/1.jpg`
  },
  {
    id: "jump_rope_single_under",
    name: "Jump Rope Single Under",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Rope_Jumping/0.jpg`,
    imgEnd: `${BASE_IMG}/Rope_Jumping/1.jpg`
  },
  {
    id: "jump_rope_double_under",
    name: "Jump Rope Double Under",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Rope_Jumping/0.jpg`,
    imgEnd: `${BASE_IMG}/Rope_Jumping/1.jpg`
  },
  {
    id: "battle_rope",
    name: "Battle Rope",
    muscle: "Funzionali",
    imgStart: `${BASE_IMG}/Battling_Ropes/0.jpg`,
    imgEnd: `${BASE_IMG}/Battling_Ropes/1.jpg`
  },
  // ==========================================
  // --- TRX ---
  // ==========================================
  {
    id: "trx_squat",
    name: "TRX Squat",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/Pq9X7FJS/Whats-App-Image-2026-11-10-at-01-25-06.jpg",
    imgEnd: "https://i.postimg.cc/Pq9X7FJS/Whats-App-Image-2026-11-10-at-01-25-06.jpg"
  },
  {
    id: "trx_jump_squat",
    name: "TRX Jump Squat",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/zf6zQPv0/Whats-App-Image-2026-11-10-at-01-25-41.jpg",
    imgEnd: "https://i.postimg.cc/zf6zQPv0/Whats-App-Image-2026-11-10-at-01-25-41.jpg"
  },
  {
    id: "trx_assisted_split_squat",
    name: "TRX Assisted Split Squat",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/9fKmkN0b/Whats-App-Image-2026-11-10-at-01-26-29.jpg",
    imgEnd: "https://i.postimg.cc/9fKmkN0b/Whats-App-Image-2026-11-10-at-01-26-29.jpg"
  },
  {
    id: "trx_reverse_lunge",
    name: "TRX Reverse Lunge",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/fbpzPgyv/Whats-App-Image-2026-11-10-at-01-28-44.jpg",
    imgEnd: "https://i.postimg.cc/fbpzPgyv/Whats-App-Image-2026-11-10-at-01-28-44.jpg"
  },
  {
    id: "trx_bulgarian_split_squat",
    name: "TRX Bulgarian Split Squat",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/9fKmkN0b/Whats-App-Image-2026-11-10-at-01-26-29.jpg",
    imgEnd: "https://i.postimg.cc/9fKmkN0b/Whats-App-Image-2026-11-10-at-01-26-29.jpg"
  },
  {
    id: "trx_pistol_squat_assistito",
    name: "TRX Pistol Squat Assistito",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/25MktXyw/Whats-App-Image-2026-11-10-at-01-27-31.jpg",
    imgEnd: "https://i.postimg.cc/25MktXyw/Whats-App-Image-2026-11-10-at-01-27-31.jpg"
  },
  {
    id: "trx_hamstring_curl",
    name: "TRX Hamstring Curl",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/VNpfhHvW/Whats-App-Image-2026-11-10-at-01-29-59.jpg",
    imgEnd: "https://i.postimg.cc/VNpfhHvW/Whats-App-Image-2026-11-10-at-01-29-59.jpg"
  },
  {
    id: "trx_hip_bridge",
    name: "TRX Hip Bridge",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/8C9pYncB/Whats-App-Image-2026-11-10-at-01-30-59.jpg",
    imgEnd: "https://i.postimg.cc/8C9pYncB/Whats-App-Image-2026-11-10-at-01-30-59.jpg"
  },
  {
    id: "trx_row",
    name: "TRX Row",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/TPFdsH1r/Whats-App-Image-2026-11-10-at-01-31-30.jpg",
    imgEnd: "https://i.postimg.cc/TPFdsH1r/Whats-App-Image-2026-11-10-at-01-31-30.jpg"
  },
  {
    id: "trx_high_row",
    name: "TRX High Row",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/SK3SPtRL/Whats-App-Image-2026-11-10-at-01-32-55.jpg",
    imgEnd: "https://i.postimg.cc/SK3SPtRL/Whats-App-Image-2026-11-10-at-01-32-55.jpg"
  },
  {
    id: "trx_wide_row",
    name: "TRX Wide Row",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/TPFdsH1r/Whats-App-Image-2026-11-10-at-01-31-30.jpg",
    imgEnd: "https://i.postimg.cc/TPFdsH1r/Whats-App-Image-2026-11-10-at-01-31-30.jpg"
  },
  {
    id: "trx_single_arm_row",
    name: "TRX Single Arm Row",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/zf6zQPvT/Whats-App-Image-2026-11-10-at-01-35-11.jpg",
    imgEnd: "https://i.postimg.cc/zf6zQPvT/Whats-App-Image-2026-11-10-at-01-35-11.jpg"
  },
  {
    id: "trx_power_pull",
    name: "TRX Power Pull",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/DzHvNY0L/Whats-App-Image-2026-11-10-at-01-35-50.jpg",
    imgEnd: "https://i.postimg.cc/DzHvNY0L/Whats-App-Image-2026-11-10-at-01-35-50.jpg"
  },
  {
    id: "trx_face_pull",
    name: "TRX Face Pull",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/5t69nM4s/Whats-App-Image-2026-11-10-at-01-36-17.jpg",
    imgEnd: "https://i.postimg.cc/5t69nM4s/Whats-App-Image-2026-11-10-at-01-36-17.jpg"
  },
  {
    id: "trx_y_fly",
    name: "TRX Y Fly",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/QMHN0r80/Whats-App-Image-2026-11-10-at-01-36-58.jpg",
    imgEnd: "https://i.postimg.cc/QMHN0r80/Whats-App-Image-2026-11-10-at-01-36-58.jpg"
  },
  {
    id: "trx_t_fly",
    name: "TRX T Fly",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/HLVWBCYz/Whats-App-Image-2026-11-10-at-01-37-29.jpg",
    imgEnd: "https://i.postimg.cc/HLVWBCYz/Whats-App-Image-2026-11-10-at-01-37-29.jpg"
  },
  {
    id: "trx_biceps_curl",
    name: "TRX Biceps Curl",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/9frXJjm1/Whats-App-Image-2026-11-10-at-01-38-09.jpg",
    imgEnd: "https://i.postimg.cc/9frXJjm1/Whats-App-Image-2026-11-10-at-01-38-09.jpg"
  },
  {
    id: "trx_chest_press",
    name: "TRX Chest Press",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/cJr1XNxc/Whats-App-Image-2026-11-10-at-01-38-58.jpg",
    imgEnd: "https://i.postimg.cc/cJr1XNxc/Whats-App-Image-2026-11-10-at-01-38-58.jpg"
  },
  {
    id: "trx_chest_fly",
    name: "TRX Chest Fly",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/PqPf2kXQ/Whats-App-Image-2026-11-10-at-01-39-32.jpg",
    imgEnd: "https://i.postimg.cc/PqPf2kXQ/Whats-App-Image-2026-11-10-at-01-39-32.jpg"
  },
  {
    id: "trx_push_up",
    name: "TRX Push-Up",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/cJr1XNxc/Whats-App-Image-2026-11-10-at-01-38-58.jpg",
    imgEnd: "https://i.postimg.cc/cJr1XNxc/Whats-App-Image-2026-11-10-at-01-38-58.jpg"
  },
  {
    id: "trx_triceps_extension",
    name: "TRX Triceps Extension",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/FK7FDQry/Whats-App-Image-2026-11-10-at-01-40-55.jpg",
    imgEnd: "https://i.postimg.cc/FK7FDQry/Whats-App-Image-2026-11-10-at-01-40-55.jpg"
  },
  {
    id: "trx_atomic_push_up",
    name: "TRX Atomic Push-Up",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/8CjktVph/Whats-App-Image-2026-11-10-at-01-41-31.jpg",
    imgEnd: "https://i.postimg.cc/8CjktVph/Whats-App-Image-2026-11-10-at-01-41-31.jpg"
  },
  {
    id: "trx_fallout",
    name: "TRX Fallout",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/5t69nM48/Whats-App-Image-2026-11-10-at-01-42-07.jpg",
    imgEnd: "https://i.postimg.cc/5t69nM48/Whats-App-Image-2026-11-10-at-01-42-07.jpg"
  },
  {
    id: "trx_mountain_climber",
    name: "TRX Mountain Climber",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/MGvZd86B/Whats-App-Image-2026-11-10-at-01-42-48.jpg",
    imgEnd: "https://i.postimg.cc/MGvZd86B/Whats-App-Image-2026-11-10-at-01-42-48.jpg"
  },
  {
    id: "trx_side_plank",
    name: "TRX Side Plank",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/KYRcJyGL/Whats-App-Image-2026-11-10-at-01-44-29.jpg",
    imgEnd: "https://i.postimg.cc/KYRcJyGL/Whats-App-Image-2026-11-10-at-01-44-29.jpg"
  },
  {
    id: "trx_pendulum",
    name: "TRX Pendulum",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/mrtZ8GLH/Whats-App-Image-2026-11-10-at-01-45-09.jpg",
    imgEnd: "https://i.postimg.cc/mrtZ8GLH/Whats-App-Image-2026-11-10-at-01-45-09.jpg"
  },
  {
    id: "trx_hamstring_runner",
    name: "TRX Hamstring Runner",
    muscle: "TRX",
    imgStart: "https://i.postimg.cc/W4hpXPNJ/Whats-App-Image-2026-11-10-at-01-45-47.jpg",
    imgEnd: "https://i.postimg.cc/W4hpXPNJ/Whats-App-Image-2026-11-10-at-01-45-47.jpg"
  },

  // ==========================================
  // --- MOBILITÀ ---
  // ==========================================
  {
    id: "cat_cow",
    name: "Cat-Cow",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/y6J8CRZ6/Whats-App-Image-2026-11-10-at-01-46-55.jpg",
    imgEnd: "https://i.postimg.cc/y6J8CRZ6/Whats-App-Image-2026-11-10-at-01-46-55.jpg"
  },
  {
    id: "childs_pose",
    name: "Child's Pose",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/59H2WzC2/Whats-App-Image-2026-11-10-at-01-52-48.jpg",
    imgEnd: "https://i.postimg.cc/59H2WzC2/Whats-App-Image-2026-11-10-at-01-52-48.jpg"
  },
  {
    id: "worlds_greatest_stretch",
    name: "World's Greatest Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/gcw2bhZY/Whats-App-Image-2026-11-10-at-01-53-52.jpg",
    imgEnd: "https://i.postimg.cc/gcw2bhZY/Whats-App-Image-2026-11-10-at-01-53-52.jpg"
  },
  {
    id: "90_90_hip_switch",
    name: "90/90 Hip Switch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/FFfHXSLN/Whats-App-Image-2026-11-10-at-01-56-43.jpg",
    imgEnd: "https://i.postimg.cc/FFfHXSLN/Whats-App-Image-2026-11-10-at-01-56-43.jpg"
  },
  {
    id: "90_90_hip_rotation",
    name: "90/90 Hip Rotation",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/FFfHXSLN/Whats-App-Image-2026-11-10-at-01-56-43.jpg",
    imgEnd: "https://i.postimg.cc/FFfHXSLN/Whats-App-Image-2026-11-10-at-01-56-43.jpg"
  },
  {
    id: "hip_cars",
    name: "Hip CARs",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/HjGNfRyD/Whats-App-Image-2026-11-10-at-02-02-52.jpg",
    imgEnd: "https://i.postimg.cc/HjGNfRyD/Whats-App-Image-2026-11-10-at-02-02-52.jpg"
  },
  {
    id: "shoulder_cars",
    name: "Shoulder CARs",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/dQ7VcCyv/Whats-App-Image-2026-11-10-at-02-01-35.jpg",
    imgEnd: "https://i.postimg.cc/dQ7VcCyv/Whats-App-Image-2026-11-10-at-02-01-35.jpg"
  },
  {
    id: "thoracic_rotation_quadrupedia",
    name: "Thoracic Rotation Quadrupedia",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/s1FLtqZt/Whats-App-Image-2026-11-10-at-02-03-40.jpg",
    imgEnd: "https://i.postimg.cc/s1FLtqZt/Whats-App-Image-2026-11-10-at-02-03-40.jpg"
  },
  {
    id: "open_book",
    name: "Open Book",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/HjGNfR7F/Whats-App-Image-2026-11-10-at-02-04-23.jpg",
    imgEnd: "https://i.postimg.cc/HjGNfR7F/Whats-App-Image-2026-11-10-at-02-04-23.jpg"
  },
  {
    id: "deep_squat_hold",
    name: "Deep Squat Hold",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/pyNSg4n4/Whats-App-Image-2026-11-10-at-02-05-02.jpg",
    imgEnd: "https://i.postimg.cc/pyNSg4n4/Whats-App-Image-2026-11-10-at-02-05-02.jpg"
  },
  {
    id: "ankle_dorsiflexion_mobilization",
    name: "Ankle Dorsiflexion Mobilization",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/7bvRpdTc/Whats-App-Image-2026-11-10-at-02-06-55.jpg",
    imgEnd: "https://i.postimg.cc/7bvRpdTc/Whats-App-Image-2026-11-10-at-02-06-55.jpg"
  },
  {
    id: "couch_stretch",
    name: "Couch Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/XXMPTmyH/Whats-App-Image-2026-11-10-at-02-07-49.jpg",
    imgEnd: "https://i.postimg.cc/XXMPTmyH/Whats-App-Image-2026-11-10-at-02-07-49.jpg"
  },
  {
    id: "hip_flexor_stretch",
    name: "Hip Flexor Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/jCV1GmJv/Whats-App-Image-2026-11-10-at-02-08-52.jpg",
    imgEnd: "https://i.postimg.cc/jCV1GmJv/Whats-App-Image-2026-11-10-at-02-08-52.jpg"
  },
  {
    id: "hamstring_dynamic_stretch",
    name: "Hamstring Dynamic Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/K4XWdwgf/Whats-App-Image-2026-11-10-at-02-09-53.jpg",
    imgEnd: "https://i.postimg.cc/K4XWdwgf/Whats-App-Image-2026-11-10-at-02-09-53.jpg"
  },
  {
    id: "adductor_rock_back",
    name: "Adductor Rock Back",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/V5yh3pbF/Whats-App-Image-2026-11-10-at-02-11-02.jpg",
    imgEnd: "https://i.postimg.cc/V5yh3pbF/Whats-App-Image-2026-11-10-at-02-11-02.jpg"
  },
  {
    id: "pectoral_doorway_stretch",
    name: "Pectoral Doorway Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/Sj0Pw3zr/Whats-App-Image-2026-11-10-at-02-12-05.jpg",
    imgEnd: "https://i.postimg.cc/Sj0Pw3zr/Whats-App-Image-2026-11-10-at-02-12-05.jpg"
  },
  {
    id: "lat_stretch",
    name: "Lat Stretch",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/K4XWdwgr/Whats-App-Image-2026-11-10-at-02-13-05.jpg",
    imgEnd: "https://i.postimg.cc/K4XWdwgr/Whats-App-Image-2026-11-10-at-02-13-05.jpg"
  },
  {
    id: "band_shoulder_dislocation",
    name: "Band Shoulder Dislocation",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/hhFYH67V/Whats-App-Image-2026-11-10-at-02-13-59.jpg",
    imgEnd: "https://i.postimg.cc/hhFYH67V/Whats-App-Image-2026-11-10-at-02-13-59.jpg"
  },
  {
    id: "scapular_retraction_elastico",
    name: "Scapular Retraction con Elastico",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/s1FLtqZS/Whats-App-Image-2026-11-10-at-02-15-13.jpg",
    imgEnd: "https://i.postimg.cc/s1FLtqZS/Whats-App-Image-2026-11-10-at-02-15-13.jpg"
  },
  {
    id: "serratus_wall_slide",
    name: "Serratus Wall Slide",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/QVLzRwW7/Whats-App-Image-2026-11-10-at-02-15-55.jpg",
    imgEnd: "https://i.postimg.cc/QVLzRwW7/Whats-App-Image-2026-11-10-at-02-15-55.jpg"
  },
  {
    id: "glute_bridge_march",
    name: "Glute Bridge March",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/bdX5KW2t/Whats-App-Image-2026-11-10-at-02-16-49.jpg",
    imgEnd: "https://i.postimg.cc/bdX5KW2t/Whats-App-Image-2026-11-10-at-02-16-49.jpg"
  },
  {
    id: "single_leg_balance",
    name: "Single Leg Balance",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/NF2VCBLk/Whats-App-Image-2026-11-10-at-02-17-35.jpg",
    imgEnd: "https://i.postimg.cc/NF2VCBLk/Whats-App-Image-2026-11-10-at-02-17-35.jpg"
  },
  {
    id: "terminal_knee_extension_elastico",
    name: "Terminal Knee Extension con Elastico",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/Hn8Kvdj4/Whats-App-Image-2026-11-10-at-02-18-53.jpg",
    imgEnd: "https://i.postimg.cc/Hn8Kvdj4/Whats-App-Image-2026-11-10-at-02-18-53.jpg"
  },
  {
    id: "spanish_squat",
    name: "Spanish Squat",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/1XVT7s40/Whats-App-Image-2026-11-10-at-02-19-47.jpg",
    imgEnd: "https://i.postimg.cc/1XVT7s40/Whats-App-Image-2026-11-10-at-02-19-47.jpg"
  },
  {
    id: "wall_sit",
    name: "Wall Sit",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/7hJctwbg/Whats-App-Image-2026-11-10-at-02-20-26.jpg",
    imgEnd: "https://i.postimg.cc/7hJctwbg/Whats-App-Image-2026-11-10-at-02-20-26.jpg"
  },
  {
    id: "isometric_split_squat",
    name: "Isometric Split Squat",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/7hJctwb3/Whats-App-Image-2026-11-10-at-02-22-12.jpg",
    imgEnd: "https://i.postimg.cc/7hJctwb3/Whats-App-Image-2026-11-10-at-02-22-12.jpg"
  },
  {
    id: "calf_isometric_hold",
    name: "Calf Isometric Hold",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/nr95SpMB/Whats-App-Image-2026-11-10-at-02-23-05.jpg",
    imgEnd: "https://i.postimg.cc/nr95SpMB/Whats-App-Image-2026-11-10-at-02-23-05.jpg"
  },
  {
    id: "dead_bug_fitball",
    name: "Dead Bug con Fitball",
    muscle: "Mobilità",
    imgStart: "https://i.postimg.cc/WzqKYTt0/Whats-App-Image-2026-11-10-at-02-24-23.jpg",
    imgEnd: "https://i.postimg.cc/WzqKYTt0/Whats-App-Image-2026-11-10-at-02-24-23.jpg"
  }
];
