// The default four-day upper/lower split.
//
// Each day is a list of movement slots. A slot names a pattern, not an
// exercise: `prefer` is the order in which variations are tried when the
// program is first built, so the split adapts to the equipment and experience
// chosen during setup. The A and B days hit the same patterns with different
// variations and rep ranges.

export const PROGRAM_TEMPLATE = [
  {
    id: 'upperA',
    name: 'Upper A',
    region: 'upper',
    focus: 'Press focus',
    slots: [
      { pattern: 'hpush', sets: 3, reps: [6, 8], rpe: 8, prefer: ['bb_bench', 'db_bench', 'machine_chest', 'band_press', 'pushup', 'incline_pushup'] },
      { pattern: 'hpull', sets: 3, reps: [8, 10], rpe: 8, prefer: ['cable_row', 'chest_supported_row', 'machine_row', 'db_row', 'band_row', 'inverted_row'] },
      { pattern: 'vpush', sets: 3, reps: [8, 10], rpe: 8, prefer: ['db_ohp', 'machine_ohp', 'kb_press', 'band_ohp', 'pike_pushup'] },
      { pattern: 'vpull', sets: 3, reps: [8, 12], rpe: 8, prefer: ['lat_pulldown', 'assisted_pullup', 'band_pulldown', 'db_pullover', 'negative_pullup'] },
      { pattern: 'lateral', sets: 3, reps: [12, 15], rpe: 8, prefer: ['db_lateral', 'cable_lateral', 'machine_lateral', 'band_lateral'] },
      { pattern: 'triceps', sets: 2, reps: [10, 15], rpe: 8, prefer: ['pushdown', 'oh_ext_db', 'band_pushdown', 'bench_dip'] },
      { pattern: 'brace', sets: 3, reps: [8, 12], rpe: 7, prefer: ['dead_bug', 'plank', 'bird_dog'] },
    ],
  },
  {
    id: 'lowerA',
    name: 'Lower A',
    region: 'lower',
    focus: 'Squat focus',
    slots: [
      { pattern: 'squat', sets: 3, reps: [6, 8], rpe: 8, prefer: ['back_squat', 'goblet_squat', 'leg_press', 'kb_front_squat', 'bw_squat'] },
      { pattern: 'hinge', sets: 3, reps: [8, 10], rpe: 8, prefer: ['rdl_db', 'rdl_bb', 'kb_deadlift', 'cable_pullthrough', 'bw_sl_rdl'] },
      { pattern: 'lunge', sets: 3, reps: [8, 10], rpe: 8, prefer: ['bulgarian', 'reverse_lunge', 'split_squat', 'bw_reverse_lunge'] },
      { pattern: 'hamcurl', sets: 3, reps: [10, 15], rpe: 8, prefer: ['seated_curl', 'lying_curl', 'band_leg_curl', 'slider_curl'] },
      { pattern: 'calf', sets: 3, reps: [10, 15], rpe: 8, prefer: ['standing_calf', 'db_calf', 'sl_calf'] },
      { pattern: 'rotate', sets: 3, reps: [10, 12], rpe: 7, prefer: ['woodchop', 'band_rotation', 'russian_twist'] },
    ],
  },
  {
    id: 'upperB',
    name: 'Upper B',
    region: 'upper',
    focus: 'Pull focus',
    slots: [
      { pattern: 'vpull', sets: 3, reps: [6, 10], rpe: 8, prefer: ['pullup', 'assisted_pullup', 'neutral_pulldown', 'lat_pulldown', 'band_pullup', 'band_pulldown', 'db_pullover'] },
      { pattern: 'hpush', sets: 3, reps: [8, 12], rpe: 8, prefer: ['incline_db', 'incline_bb', 'machine_chest', 'db_floor_press', 'pushup', 'incline_pushup'] },
      { pattern: 'hpull', sets: 3, reps: [8, 12], rpe: 8, prefer: ['db_row', 'sa_cable_row', 'machine_row', 'tbar_row', 'inverted_row', 'band_row'] },
      { pattern: 'vpush', sets: 3, reps: [8, 12], rpe: 8, prefer: ['half_kneel_press', 'landmine_press', 'arnold', 'machine_ohp', 'kb_press', 'band_ohp', 'pike_pushup'] },
      { pattern: 'rear', sets: 3, reps: [12, 15], rpe: 8, prefer: ['face_pull', 'reverse_fly_db', 'reverse_pec_deck', 'band_pull_apart'] },
      { pattern: 'biceps', sets: 2, reps: [10, 15], rpe: 8, prefer: ['db_curl', 'cable_curl', 'ez_curl', 'band_curl'] },
      { pattern: 'rotate', sets: 3, reps: [8, 12], rpe: 7, prefer: ['pallof', 'band_pallof', 'side_plank_reach'] },
    ],
  },
  {
    id: 'lowerB',
    name: 'Lower B',
    region: 'lower',
    focus: 'Hinge & glute focus',
    slots: [
      { pattern: 'hinge', sets: 3, reps: [5, 8], rpe: 8, prefer: ['trapbar_dl', 'rdl_bb', 'kb_deadlift', 'sl_rdl', 'cable_pullthrough', 'back_extension', 'bw_sl_rdl'] },
      { pattern: 'glute', sets: 3, reps: [8, 12], rpe: 8, prefer: ['hip_thrust_bb', 'hip_thrust_machine', 'glute_bridge_db', 'sl_hip_thrust', 'glute_bridge_bw'] },
      { pattern: 'lunge', sets: 3, reps: [8, 12], rpe: 8, prefer: ['lateral_lunge', 'step_up', 'curtsy_lunge', 'cossack', 'bw_reverse_lunge'] },
      { pattern: 'squat', sets: 2, reps: [10, 12], rpe: 8, prefer: ['leg_press', 'heel_elev_goblet', 'plie_squat', 'goblet_squat', 'bw_squat'] },
      { pattern: 'hip', sets: 2, reps: [12, 15], rpe: 8, prefer: ['abduction_machine', 'band_lateral_walk', 'cable_abduction', 'side_lying_raise'] },
      { pattern: 'calf', sets: 3, reps: [12, 15], rpe: 8, prefer: ['seated_calf', 'tib_raise', 'sl_calf'] },
      { pattern: 'brace', sets: 3, reps: [8, 12], rpe: 7, prefer: ['side_plank', 'suitcase_carry', 'plank'] },
    ],
  },
];

// Target used when a movement is added outside the plan.
export const DEFAULT_TARGET = { sets: 3, reps: [8, 12], rpe: 8 };

// Short prep sequences shown at the top of a session.
export const WARMUPS = {
  lower: [
    { name: '90/90 hip switches', dose: '8 per side' },
    { name: "World's greatest stretch", dose: '5 per side' },
    { name: 'Knee-to-wall ankle rocks', dose: '10 per side' },
    { name: 'Glute bridge', dose: '12 reps' },
    { name: 'Bodyweight squat', dose: '10 slow reps' },
  ],
  upper: [
    { name: 'Cat-cow', dose: '8 reps' },
    { name: 'Open-book thoracic rotation', dose: '8 per side' },
    { name: 'Band pull-apart or arm circles', dose: '15 reps' },
    { name: 'Scapular push-up', dose: '10 reps' },
    { name: 'Light set of the first lift', dose: '1 to 2 sets' },
  ],
};
