// Movement patterns and the exercise library.
//
// Every exercise belongs to exactly one movement pattern. The seven "core"
// patterns are the foundation of the upper/lower split; accessories and trunk
// work fill in around them.
//
// Exercise fields:
//   level   1 = friendly to learn, 2 = needs some practice, 3 = advanced
//   equip   the one piece of kit it needs ("bodyweight" is always available)
//   uni     trained one side at a time (reps are per side)
//   timed   logged in seconds instead of reps
//   bw      bodyweight-loaded: the weight field is optional (added load)
//   heavy   suits low-rep, heavy loading
//   cue     one coaching cue
//   dance   why it carries over to the dance floor

export const EQUIPMENT = [
  { id: 'barbell', name: 'Barbell & rack' },
  { id: 'dumbbell', name: 'Dumbbells' },
  { id: 'kettlebell', name: 'Kettlebells' },
  { id: 'machine', name: 'Machines' },
  { id: 'cable', name: 'Cables' },
  { id: 'band', name: 'Bands' },
  { id: 'pullup', name: 'Pull-up bar' },
];

export const EQUIP_LABEL = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  machine: 'Machine',
  cable: 'Cable',
  band: 'Band',
  pullup: 'Pull-up bar',
  bodyweight: 'Bodyweight',
};

export const LEVEL_LABEL = { 1: 'Foundational', 2: 'Intermediate', 3: 'Advanced' };

export const PATTERNS = {
  squat: { name: 'Squat', region: 'lower', tier: 'core', blurb: 'Knee-dominant strength for quads and glutes.' },
  hinge: { name: 'Hinge', region: 'lower', tier: 'core', blurb: 'Hip-dominant strength for glutes and hamstrings.' },
  lunge: { name: 'Single-Leg', region: 'lower', tier: 'core', blurb: 'One leg at a time: balance, control, symmetry.' },
  hpush: { name: 'Horizontal Push', region: 'upper', tier: 'core', blurb: 'Pressing away from the chest: chest, shoulders, triceps.' },
  vpush: { name: 'Vertical Push', region: 'upper', tier: 'core', blurb: 'Pressing overhead: shoulders and triceps.' },
  hpull: { name: 'Horizontal Pull', region: 'upper', tier: 'core', blurb: 'Rows: mid-back, lats and posture.' },
  vpull: { name: 'Vertical Pull', region: 'upper', tier: 'core', blurb: 'Pull-downs and pull-ups: lats and grip.' },

  glute: { name: 'Glute Bridge', region: 'lower', tier: 'accessory', blurb: 'Direct glute work at full hip extension.' },
  hamcurl: { name: 'Hamstring Curl', region: 'lower', tier: 'accessory', blurb: 'Knee-flexion strength for the hamstrings.' },
  hip: { name: 'Hip Stability', region: 'lower', tier: 'accessory', blurb: 'Abductors, adductors and rotators that steer the hip.' },
  calf: { name: 'Calf & Ankle', region: 'lower', tier: 'accessory', blurb: 'Calves, shins and ankle strength.' },
  lateral: { name: 'Side Delts', region: 'upper', tier: 'accessory', blurb: 'Shoulder width and arm-line endurance.' },
  rear: { name: 'Rear Delts & Upper Back', region: 'upper', tier: 'accessory', blurb: 'Posture muscles that hold the shoulders open.' },
  biceps: { name: 'Biceps', region: 'upper', tier: 'accessory', blurb: 'Elbow flexion.' },
  triceps: { name: 'Triceps', region: 'upper', tier: 'accessory', blurb: 'Elbow extension.' },

  brace: { name: 'Core Stability', region: 'trunk', tier: 'trunk', blurb: 'Holding the ribs and pelvis still while the limbs move.' },
  rotate: { name: 'Core Rotation', region: 'trunk', tier: 'trunk', blurb: 'Creating rotation, and stopping it on a dime.' },
};

export const PATTERN_GROUPS = [
  { tier: 'core', title: 'Core movements', note: 'The seven patterns the split is built on.' },
  { tier: 'accessory', title: 'Accessories', note: 'Smaller muscles and joints that support the big lifts.' },
  { tier: 'trunk', title: 'Abs & trunk', note: 'Stability and rotation through the middle.' },
];

const X = (id, name, pattern, equip, level, opts = {}) => ({ id, name, pattern, equip, level, ...opts });

export const EXERCISES = [
  // ── Squat ────────────────────────────────────────────────────────────────
  X('goblet_squat', 'Goblet Squat', 'squat', 'dumbbell', 1, {
    cue: 'Hold the weight at your chest, sit down between your hips, drive the floor away.',
  }),
  X('back_squat', 'Barbell Back Squat', 'squat', 'barbell', 2, {
    heavy: true,
    cue: 'Big breath, brace, break at hips and knees together, keep the bar over mid-foot.',
  }),
  X('front_squat', 'Front Squat', 'squat', 'barbell', 3, {
    heavy: true,
    cue: 'Elbows high, torso tall, knees travel forward over the toes.',
    dance: 'Demands a tall, braced torso, the same posture that holds your frame.',
  }),
  X('leg_press', 'Leg Press', 'squat', 'machine', 1, {
    heavy: true,
    cue: 'Lower until your hips want to tuck, then press through the whole foot.',
  }),
  X('hack_squat', 'Hack Squat', 'squat', 'machine', 2, {
    heavy: true,
    cue: 'Shoulders tight to the pads, descend under control, drive up without locking hard.',
  }),
  X('heel_elev_goblet', 'Heel-Elevated Goblet Squat', 'squat', 'dumbbell', 1, {
    cue: 'Heels on a wedge or plate, stay upright and let the knees travel well forward.',
    dance: 'Loads the quads in a raised-heel position, building knee strength for dancing in heels.',
  }),
  X('plie_squat', 'Plié Squat', 'squat', 'dumbbell', 1, {
    cue: 'Wide turned-out stance, knees track over toes, weight hangs between the legs.',
    dance: 'A turned-out stance you already own, now loaded for adductors and glutes.',
  }),
  X('box_squat', 'Box Squat', 'squat', 'barbell', 2, {
    heavy: true,
    cue: 'Sit back to the box with control, stay tight, stand without rocking.',
  }),
  X('pause_squat', 'Pause Squat', 'squat', 'barbell', 3, {
    heavy: true,
    cue: 'Hold two full seconds at the bottom, stay braced, then drive straight up.',
  }),
  X('smith_squat', 'Smith Machine Squat', 'squat', 'machine', 1, {
    heavy: true,
    cue: 'Feet slightly forward, sit straight down, press evenly through both feet.',
  }),
  X('kb_front_squat', 'Double Kettlebell Front Squat', 'squat', 'kettlebell', 2, {
    cue: 'Bells racked at the shoulders, elbows down, ribs stacked over hips.',
  }),
  X('bw_squat', 'Bodyweight Squat', 'squat', 'bodyweight', 1, {
    bw: true,
    cue: 'Arms out front for balance, full depth, smooth tempo.',
  }),

  // ── Hinge ────────────────────────────────────────────────────────────────
  X('rdl_db', 'Dumbbell Romanian Deadlift', 'hinge', 'dumbbell', 1, {
    cue: 'Soft knees, push the hips back, slide the weights down the thighs to a hamstring stretch.',
  }),
  X('rdl_bb', 'Barbell Romanian Deadlift', 'hinge', 'barbell', 2, {
    heavy: true,
    cue: 'Bar stays on the legs, hips travel back, stop when the hips stop moving.',
  }),
  X('trapbar_dl', 'Trap Bar Deadlift', 'hinge', 'barbell', 2, {
    heavy: true,
    cue: 'Stand inside the bar, chest up, push the floor away and stand tall.',
  }),
  X('deadlift', 'Conventional Deadlift', 'hinge', 'barbell', 3, {
    heavy: true,
    cue: 'Bar over mid-foot, pull the slack out, drive the floor away and keep the bar close.',
  }),
  X('sumo_dl', 'Sumo Deadlift', 'hinge', 'barbell', 3, {
    heavy: true,
    cue: 'Wide stance, knees out over the toes, hips close to the bar, chest proud.',
    dance: 'Uses the open-hip turnout you already have and turns it into pulling strength.',
  }),
  X('sl_rdl', 'Single-Leg Romanian Deadlift', 'hinge', 'dumbbell', 2, {
    uni: true,
    cue: 'Hinge over one leg, back leg long, hips stay square to the floor.',
    dance: 'Standing-leg balance and hip control, the base every spin is built on.',
  }),
  X('kb_deadlift', 'Kettlebell Deadlift', 'hinge', 'kettlebell', 1, {
    cue: 'Bell between the ankles, hinge to it with a flat back, stand by squeezing the glutes.',
  }),
  X('kb_swing', 'Kettlebell Swing', 'hinge', 'kettlebell', 2, {
    cue: 'Hike the bell back, snap the hips, let the arms float. It is a hinge, not a squat.',
    dance: 'Fast, crisp hip extension for explosive direction changes.',
  }),
  X('cable_pullthrough', 'Cable Pull-Through', 'hinge', 'cable', 1, {
    cue: 'Face away from the stack, reach the hips back, finish tall with glutes tight.',
  }),
  X('back_extension', '45° Back Extension', 'hinge', 'machine', 1, {
    bw: true,
    cue: 'Pads below the hips, hinge down long, come up until the body is one straight line.',
  }),
  X('good_morning', 'Good Morning', 'hinge', 'barbell', 3, {
    cue: 'Bar on the upper back, hips back with a proud chest, stop before the back rounds.',
  }),
  X('bw_sl_rdl', 'Single-Leg Hinge Reach', 'hinge', 'bodyweight', 1, {
    uni: true,
    bw: true,
    cue: 'Reach the opposite hand toward the floor as the back leg lifts, slow and level.',
    dance: 'Balance practice on the standing leg with no load to hide behind.',
  }),

  // ── Single-leg ───────────────────────────────────────────────────────────
  X('split_squat', 'Split Squat', 'lunge', 'dumbbell', 1, {
    uni: true,
    cue: 'Staggered stance, drop straight down, front foot flat and heavy.',
  }),
  X('reverse_lunge', 'Reverse Lunge', 'lunge', 'dumbbell', 1, {
    uni: true,
    cue: 'Step back softly, lower under control, push through the front foot to return.',
  }),
  X('bulgarian', 'Bulgarian Split Squat', 'lunge', 'dumbbell', 2, {
    uni: true,
    cue: 'Back foot on a bench, sink straight down, slight forward lean, front heel down.',
    dance: 'Deep single-leg strength with a hip-flexor stretch on the back leg.',
  }),
  X('walking_lunge', 'Walking Lunge', 'lunge', 'dumbbell', 2, {
    uni: true,
    cue: 'Long steps, torso tall, drive off the front leg into the next step.',
  }),
  X('lateral_lunge', 'Lateral Lunge', 'lunge', 'dumbbell', 2, {
    uni: true,
    cue: 'Step wide, sit into one hip with the other leg straight, push back to center.',
    dance: 'Side-to-side strength in the plane where most of your footwork happens.',
  }),
  X('step_up', 'Step-Up', 'lunge', 'dumbbell', 1, {
    uni: true,
    cue: 'Whole foot on the box, stand up without pushing off the floor, lower slowly.',
  }),
  X('curtsy_lunge', 'Curtsy Lunge', 'lunge', 'dumbbell', 2, {
    uni: true,
    cue: 'Step back and across, hips stay square, feel the outside of the front hip.',
    dance: 'Crossing steps under load train the hip rotators that steer your turns.',
  }),
  X('ffe_split_squat', 'Front-Foot-Elevated Split Squat', 'lunge', 'dumbbell', 2, {
    uni: true,
    cue: 'Front foot on a low plate, sink deep, let the front knee travel forward.',
  }),
  X('cossack', 'Cossack Squat', 'lunge', 'bodyweight', 2, {
    uni: true,
    bw: true,
    cue: 'Shift side to side, sitting deep over one heel while the other leg stays long.',
    dance: 'Builds strength at the end of your hip range, where flexibility alone is not enough.',
  }),
  X('skater_squat', 'Skater Squat', 'lunge', 'bodyweight', 3, {
    uni: true,
    bw: true,
    cue: 'Back knee taps a pad behind you, torso leans forward, stand through the front leg.',
  }),
  X('box_pistol', 'Single-Leg Squat to Box', 'lunge', 'bodyweight', 3, {
    uni: true,
    bw: true,
    cue: 'Sit back to a box on one leg, free leg forward, stand without rocking.',
  }),
  X('bw_reverse_lunge', 'Bodyweight Reverse Lunge', 'lunge', 'bodyweight', 1, {
    uni: true,
    bw: true,
    cue: 'Step back softly, back knee kisses the floor, drive up through the front foot.',
  }),

  // ── Glute bridge ─────────────────────────────────────────────────────────
  X('hip_thrust_bb', 'Barbell Hip Thrust', 'glute', 'barbell', 2, {
    heavy: true,
    cue: 'Shoulder blades on the bench, chin tucked, lock out with ribs down and glutes hard.',
  }),
  X('hip_thrust_machine', 'Hip Thrust Machine', 'glute', 'machine', 1, {
    heavy: true,
    cue: 'Feet flat, drive through the heels, pause at the top.',
  }),
  X('glute_bridge_db', 'Dumbbell Glute Bridge', 'glute', 'dumbbell', 1, {
    cue: 'Weight on the hips, press through the heels, squeeze at the top for a beat.',
  }),
  X('b_stance_thrust', 'B-Stance Hip Thrust', 'glute', 'dumbbell', 2, {
    uni: true,
    cue: 'One foot planted, the other a light kickstand. The planted leg does the work.',
  }),
  X('kas_bridge', 'KAS Glute Bridge', 'glute', 'barbell', 2, {
    cue: 'Short range from the top, hips only, constant tension.',
  }),
  X('sl_hip_thrust', 'Single-Leg Hip Thrust', 'glute', 'bodyweight', 2, {
    uni: true,
    bw: true,
    cue: 'One knee pulled in, press through the planted heel, keep the hips level.',
    dance: 'Evens out left-to-right hip power, useful if you favor one turning side.',
  }),
  X('cable_kickback', 'Cable Glute Kickback', 'glute', 'cable', 1, {
    uni: true,
    cue: 'Slight forward lean, sweep the leg back from the hip without arching the back.',
  }),
  X('glute_bridge_bw', 'Glute Bridge', 'glute', 'bodyweight', 1, {
    bw: true,
    cue: 'Ribs down, press through the heels, hold the top for two seconds.',
  }),

  // ── Hamstring curl ───────────────────────────────────────────────────────
  X('seated_curl', 'Seated Leg Curl', 'hamcurl', 'machine', 1, {
    cue: 'Hips pinned to the seat, curl fully, take three seconds on the way back.',
  }),
  X('lying_curl', 'Lying Leg Curl', 'hamcurl', 'machine', 1, {
    cue: 'Hips pressed into the pad, curl to the glutes, lower slowly.',
  }),
  X('ball_curl', 'Stability Ball Leg Curl', 'hamcurl', 'bodyweight', 2, {
    bw: true,
    cue: 'Bridge up, roll the ball in with the heels, hips stay high the whole time.',
  }),
  X('slider_curl', 'Slider Leg Curl', 'hamcurl', 'bodyweight', 2, {
    bw: true,
    cue: 'Heels on sliders or a towel, bridge and drag the heels in, extend slowly.',
  }),
  X('band_leg_curl', 'Banded Leg Curl', 'hamcurl', 'band', 1, {
    cue: 'Band around the ankles, curl against it without letting the hips lift.',
  }),
  X('nordic', 'Nordic Curl', 'hamcurl', 'bodyweight', 3, {
    bw: true,
    cue: 'Ankles anchored, lower as slowly as you can, push back up from the floor.',
    dance: 'Eccentric hamstring strength, the kind that protects against strains in fast kicks and extensions.',
  }),

  // ── Hip stability ────────────────────────────────────────────────────────
  X('abduction_machine', 'Hip Abduction Machine', 'hip', 'machine', 1, {
    cue: 'Sit tall or lean slightly forward, press the knees out, control the return.',
  }),
  X('adduction_machine', 'Hip Adduction Machine', 'hip', 'machine', 1, {
    cue: 'Squeeze the pads together, pause, open slowly into the stretch.',
  }),
  X('band_lateral_walk', 'Banded Lateral Walk', 'hip', 'band', 1, {
    bw: true,
    cue: 'Band above the knees or at the ankles, stay low, step without rocking the torso.',
    dance: 'Trains the outer hip to keep the pelvis level through side steps.',
  }),
  X('cable_abduction', 'Cable Hip Abduction', 'hip', 'cable', 1, {
    uni: true,
    cue: 'Stand tall, sweep the leg out to the side, no leaning.',
  }),
  X('side_lying_raise', 'Side-Lying Leg Raise', 'hip', 'bodyweight', 1, {
    uni: true,
    bw: true,
    cue: 'Top leg long and slightly behind you, lift from the hip, toes forward.',
  }),
  X('clamshell', 'Banded Clamshell', 'hip', 'band', 1, {
    uni: true,
    bw: true,
    cue: 'Heels together, open the top knee without rolling the hips back.',
  }),
  X('copenhagen', 'Copenhagen Plank', 'hip', 'bodyweight', 3, {
    uni: true,
    bw: true,
    timed: true,
    hold: [15, 30],
    cue: 'Top leg on a bench, lift the hips and the bottom leg, hold a straight line.',
    dance: 'Inner-thigh strength that protects the groin in wide, fast steps.',
  }),
  X('hip_airplane', 'Hip Airplane', 'hip', 'bodyweight', 3, {
    uni: true,
    bw: true,
    cue: 'Hinged on one leg, open and close the pelvis slowly around the standing hip.',
    dance: 'Rotational control over the standing hip, exactly what a clean spin asks for.',
  }),

  // ── Calf & ankle ─────────────────────────────────────────────────────────
  X('standing_calf', 'Standing Calf Raise', 'calf', 'machine', 1, {
    cue: 'Full stretch at the bottom, rise as high as you can, pause at the top.',
  }),
  X('seated_calf', 'Seated Calf Raise', 'calf', 'machine', 1, {
    cue: 'Knees bent to target the soleus, slow stretch, firm squeeze.',
    dance: 'Bent-knee calf strength, the position you spend most of a song in.',
  }),
  X('sl_calf', 'Single-Leg Calf Raise', 'calf', 'bodyweight', 2, {
    uni: true,
    bw: true,
    cue: 'Off the edge of a step, full range, hold a rail lightly for balance.',
    dance: 'Relevé strength one leg at a time, so both ankles hold up equally.',
  }),
  X('db_calf', 'Dumbbell Calf Raise', 'calf', 'dumbbell', 1, {
    cue: 'Balls of the feet on a step, dumbbells at your sides, full stretch and full rise.',
  }),
  X('leg_press_calf', 'Leg Press Calf Raise', 'calf', 'machine', 1, {
    cue: 'Balls of the feet on the plate edge, press through the big toe, no bouncing.',
  }),
  X('tib_raise', 'Tibialis Raise', 'calf', 'bodyweight', 1, {
    bw: true,
    cue: 'Back against a wall, heels out front, pull the toes up toward the shins.',
    dance: 'Strengthens the shins to balance all the time spent on the balls of your feet.',
  }),

  // ── Horizontal push ──────────────────────────────────────────────────────
  X('db_bench', 'Dumbbell Bench Press', 'hpush', 'dumbbell', 1, {
    heavy: true,
    cue: 'Shoulder blades tucked, lower to chest height, press up and slightly in.',
  }),
  X('bb_bench', 'Barbell Bench Press', 'hpush', 'barbell', 2, {
    heavy: true,
    cue: 'Feet planted, bar to the lower chest, press back toward the shoulders.',
  }),
  X('incline_db', 'Incline Dumbbell Press', 'hpush', 'dumbbell', 1, {
    cue: 'Bench at about 30 degrees, elbows under the wrists, press to a soft lockout.',
  }),
  X('incline_bb', 'Incline Barbell Press', 'hpush', 'barbell', 2, {
    heavy: true,
    cue: 'Bar to the upper chest, forearms vertical, drive straight up.',
  }),
  X('machine_chest', 'Machine Chest Press', 'hpush', 'machine', 1, {
    heavy: true,
    cue: 'Handles at mid-chest, shoulders down, press without shrugging.',
  }),
  X('cable_press', 'Standing Cable Press', 'hpush', 'cable', 2, {
    cue: 'Staggered stance, press forward without letting the torso twist.',
    dance: 'Pressing while the trunk resists rotation, the strength behind a firm lead-and-follow connection.',
  }),
  X('db_floor_press', 'Dumbbell Floor Press', 'hpush', 'dumbbell', 1, {
    cue: 'Lying on the floor, lower until the upper arms rest lightly, then press.',
  }),
  X('pushup', 'Push-Up', 'hpush', 'bodyweight', 2, {
    bw: true,
    cue: 'Body in one line, chest to the floor, push the ground away.',
  }),
  X('incline_pushup', 'Incline Push-Up', 'hpush', 'bodyweight', 1, {
    bw: true,
    cue: 'Hands on a bench or bar, straight line from head to heels, full range.',
  }),
  X('feet_elev_pushup', 'Feet-Elevated Push-Up', 'hpush', 'bodyweight', 3, {
    bw: true,
    cue: 'Feet on a bench, hips level, lower the chest between the hands.',
  }),
  X('band_press', 'Banded Chest Press', 'hpush', 'band', 1, {
    cue: 'Band anchored behind you, press forward and control the return.',
  }),

  // ── Vertical push ────────────────────────────────────────────────────────
  X('db_ohp', 'Seated Dumbbell Shoulder Press', 'vpush', 'dumbbell', 1, {
    heavy: true,
    cue: 'Ribs down, press up and slightly in, lower to ear height.',
  }),
  X('bb_ohp', 'Barbell Overhead Press', 'vpush', 'barbell', 2, {
    heavy: true,
    cue: 'Squeeze the glutes, press the bar in a straight line, head through at the top.',
  }),
  X('arnold', 'Arnold Press', 'vpush', 'dumbbell', 2, {
    cue: 'Start with palms facing you, rotate as you press, reverse on the way down.',
  }),
  X('half_kneel_press', 'Half-Kneeling Single-Arm Press', 'vpush', 'dumbbell', 2, {
    uni: true,
    cue: 'One knee down, glute tight on that side, press without leaning or arching.',
    dance: 'Overhead reach with the ribs stacked over the hips, for arm styling without arching the back.',
  }),
  X('landmine_press', 'Landmine Press', 'vpush', 'barbell', 1, {
    uni: true,
    cue: 'Press the bar up and forward along its arc, reach long at the top.',
  }),
  X('machine_ohp', 'Machine Shoulder Press', 'vpush', 'machine', 1, {
    heavy: true,
    cue: 'Seat set so the handles start at shoulder height, press without shrugging.',
  }),
  X('kb_press', 'Kettlebell Overhead Press', 'vpush', 'kettlebell', 2, {
    uni: true,
    cue: 'Bell resting on the forearm, press in a slight arc, bicep by the ear.',
  }),
  X('pike_pushup', 'Pike Push-Up', 'vpush', 'bodyweight', 2, {
    bw: true,
    cue: 'Hips high, lower the crown of the head toward the floor, press back up.',
  }),
  X('band_ohp', 'Banded Overhead Press', 'vpush', 'band', 1, {
    cue: 'Stand on the band, press overhead, finish with the arms by the ears.',
  }),

  // ── Horizontal pull ──────────────────────────────────────────────────────
  X('cable_row', 'Seated Cable Row', 'hpull', 'cable', 1, {
    heavy: true,
    cue: 'Sit tall, pull to the lower ribs, squeeze the shoulder blades, reach long on the return.',
  }),
  X('db_row', 'One-Arm Dumbbell Row', 'hpull', 'dumbbell', 1, {
    uni: true,
    heavy: true,
    cue: 'Flat back, pull the elbow toward the hip, no twisting.',
  }),
  X('chest_supported_row', 'Chest-Supported Dumbbell Row', 'hpull', 'dumbbell', 1, {
    cue: 'Chest on an incline bench, row both sides, pause at the top.',
  }),
  X('bb_row', 'Barbell Bent-Over Row', 'hpull', 'barbell', 2, {
    heavy: true,
    cue: 'Hinge to about 45 degrees, pull the bar to the belly button, keep the back still.',
  }),
  X('machine_row', 'Machine Row', 'hpull', 'machine', 1, {
    heavy: true,
    cue: 'Chest on the pad, drive the elbows back, pause, return slowly.',
  }),
  X('tbar_row', 'Landmine Row', 'hpull', 'barbell', 2, {
    heavy: true,
    cue: 'Straddle the bar, hinge, row to the chest with elbows close.',
  }),
  X('sa_cable_row', 'Single-Arm Cable Row', 'hpull', 'cable', 2, {
    uni: true,
    cue: 'Split stance, reach long, then row and let the ribs turn slightly toward the handle.',
    dance: 'A row with a touch of rotation, connecting arm, back and hips the way partner work does.',
  }),
  X('inverted_row', 'Inverted Row', 'hpull', 'bodyweight', 2, {
    bw: true,
    cue: 'Under a bar or rings, body rigid, pull the chest to the bar.',
  }),
  X('band_row', 'Banded Row', 'hpull', 'band', 1, {
    cue: 'Band anchored in front, pull the elbows back, squeeze, return slowly.',
  }),

  // ── Vertical pull ────────────────────────────────────────────────────────
  X('lat_pulldown', 'Lat Pulldown', 'vpull', 'cable', 1, {
    heavy: true,
    cue: 'Slight lean back, pull the bar to the collarbone, elbows drive down to the ribs.',
  }),
  X('neutral_pulldown', 'Neutral-Grip Pulldown', 'vpull', 'cable', 1, {
    heavy: true,
    cue: 'Palms facing each other, pull the handle to the upper chest, shoulders stay down.',
  }),
  X('assisted_pullup', 'Assisted Pull-Up', 'vpull', 'machine', 1, {
    cue: 'Use just enough assistance to finish the set, chin over the bar, full hang at the bottom.',
  }),
  X('band_pullup', 'Band-Assisted Pull-Up', 'vpull', 'pullup', 2, {
    bw: true,
    cue: 'Foot or knee in the band, start from a dead hang, pull the chest to the bar.',
  }),
  X('negative_pullup', 'Negative Pull-Up', 'vpull', 'pullup', 2, {
    bw: true,
    cue: 'Jump or step to the top, then lower for five slow seconds.',
  }),
  X('pullup', 'Pull-Up', 'vpull', 'pullup', 3, {
    bw: true,
    heavy: true,
    cue: 'Dead hang, pull the elbows to the ribs, chin over the bar, control the descent.',
  }),
  X('chinup', 'Chin-Up', 'vpull', 'pullup', 3, {
    bw: true,
    heavy: true,
    cue: 'Palms facing you, shoulder-width grip, lead with the chest.',
  }),
  X('sa_pulldown', 'Single-Arm Cable Pulldown', 'vpull', 'cable', 2, {
    uni: true,
    cue: 'Half-kneeling, reach all the way up, pull the elbow into the back pocket.',
  }),
  X('band_pulldown', 'Banded Pulldown', 'vpull', 'band', 1, {
    cue: 'Band anchored overhead, kneel, pull the elbows down to the ribs.',
  }),
  X('db_pullover', 'Dumbbell Pullover', 'vpull', 'dumbbell', 1, {
    cue: 'Lying on a bench, arms nearly straight, reach back to a lat stretch and pull over the chest.',
  }),

  // ── Side delts ───────────────────────────────────────────────────────────
  X('db_lateral', 'Dumbbell Lateral Raise', 'lateral', 'dumbbell', 1, {
    cue: 'Lead with the elbows, lift to shoulder height, lower slower than you lifted.',
    dance: 'Shoulder endurance for holding your arm line through a full song.',
  }),
  X('cable_lateral', 'Cable Lateral Raise', 'lateral', 'cable', 2, {
    uni: true,
    cue: 'Cable behind the body, sweep out and up, constant tension.',
  }),
  X('machine_lateral', 'Machine Lateral Raise', 'lateral', 'machine', 1, {
    cue: 'Elbows against the pads, lift to shoulder height, no shrugging.',
  }),
  X('lean_lateral', 'Lean-Away Lateral Raise', 'lateral', 'dumbbell', 2, {
    uni: true,
    cue: 'Hold a post and lean away, raise through a longer range.',
  }),
  X('band_lateral', 'Banded Lateral Raise', 'lateral', 'band', 1, {
    cue: 'Stand on the band, raise to shoulder height, pause at the top.',
  }),

  // ── Rear delts & upper back ──────────────────────────────────────────────
  X('face_pull', 'Face Pull', 'rear', 'cable', 1, {
    cue: 'Rope at face height, pull toward the eyes, finish with the hands apart and elbows high.',
    dance: 'Opens the chest and sets the shoulder blades, the posture behind a strong frame.',
  }),
  X('reverse_fly_db', 'Dumbbell Reverse Fly', 'rear', 'dumbbell', 1, {
    cue: 'Hinged over, sweep the arms wide, thumbs forward, no swinging.',
  }),
  X('reverse_pec_deck', 'Reverse Pec Deck', 'rear', 'machine', 1, {
    cue: 'Chest on the pad, sweep the arms back in a wide arc, pause.',
  }),
  X('cable_rear_fly', 'Cable Rear-Delt Fly', 'rear', 'cable', 2, {
    cue: 'Cables crossed at shoulder height, pull apart with nearly straight arms.',
  }),
  X('band_pull_apart', 'Band Pull-Apart', 'rear', 'band', 1, {
    bw: true,
    cue: 'Arms straight in front, pull the band to the chest by spreading the hands.',
  }),
  X('prone_y_raise', 'Prone Y-Raise', 'rear', 'dumbbell', 1, {
    cue: 'Face down on an incline bench, raise the arms in a Y with thumbs up. Go light.',
    dance: 'Lower-trap strength that keeps the shoulders down when the arms go up.',
  }),

  // ── Biceps ───────────────────────────────────────────────────────────────
  X('db_curl', 'Dumbbell Curl', 'biceps', 'dumbbell', 1, {
    cue: 'Elbows by the ribs, curl without swinging, lower all the way.',
  }),
  X('hammer_curl', 'Hammer Curl', 'biceps', 'dumbbell', 1, {
    cue: 'Palms facing each other throughout, elbows still.',
  }),
  X('incline_curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell', 2, {
    cue: 'Lying back on an incline, arms hang behind the body, curl from the stretch.',
  }),
  X('cable_curl', 'Cable Curl', 'biceps', 'cable', 1, {
    cue: 'Step back for constant tension, curl to the shoulders, slow return.',
  }),
  X('ez_curl', 'EZ-Bar Curl', 'biceps', 'barbell', 1, {
    cue: 'Angled grip, elbows pinned, no leaning back.',
  }),
  X('band_curl', 'Banded Curl', 'biceps', 'band', 1, {
    cue: 'Stand on the band, curl up, squeeze hard at the top.',
  }),

  // ── Triceps ──────────────────────────────────────────────────────────────
  X('pushdown', 'Cable Triceps Pushdown', 'triceps', 'cable', 1, {
    cue: 'Elbows pinned to the sides, press down and spread the rope at the bottom.',
  }),
  X('oh_cable_ext', 'Overhead Cable Extension', 'triceps', 'cable', 2, {
    cue: 'Facing away, elbows by the ears, extend fully and stretch on the way back.',
  }),
  X('oh_ext_db', 'Overhead Dumbbell Extension', 'triceps', 'dumbbell', 1, {
    cue: 'One dumbbell in both hands, elbows pointing up, lower behind the head and extend.',
  }),
  X('skullcrusher', 'Skull Crusher', 'triceps', 'barbell', 2, {
    cue: 'Lower the bar just behind the head, upper arms still, extend to lockout.',
  }),
  X('db_kickback', 'Dumbbell Kickback', 'triceps', 'dumbbell', 1, {
    uni: true,
    cue: 'Upper arm parallel to the floor, extend the elbow fully, pause.',
  }),
  X('bench_dip', 'Bench Dip', 'triceps', 'bodyweight', 1, {
    bw: true,
    cue: 'Hands on a bench behind you, lower until the upper arms are parallel, press up.',
  }),
  X('close_pushup', 'Close-Grip Push-Up', 'triceps', 'bodyweight', 2, {
    bw: true,
    cue: 'Hands under the shoulders, elbows brush the ribs.',
  }),
  X('band_pushdown', 'Banded Pushdown', 'triceps', 'band', 1, {
    cue: 'Band anchored overhead, elbows fixed, press to full extension.',
  }),

  // ── Core stability ───────────────────────────────────────────────────────
  X('dead_bug', 'Dead Bug', 'brace', 'bodyweight', 1, {
    uni: true,
    bw: true,
    cue: 'Lower back heavy on the floor, reach opposite arm and leg long, exhale as you reach.',
    dance: 'Ribs stay over the hips while the limbs move, the control underneath clean body isolations.',
  }),
  X('plank', 'Front Plank', 'brace', 'bodyweight', 1, {
    bw: true,
    timed: true,
    hold: [30, 45],
    cue: 'Elbows under the shoulders, glutes tight, pull the elbows toward the toes.',
  }),
  X('side_plank', 'Side Plank', 'brace', 'bodyweight', 1, {
    uni: true,
    bw: true,
    timed: true,
    hold: [20, 40],
    cue: 'Elbow under the shoulder, hips forward and high, one long line.',
    dance: 'Side-body stiffness that keeps the torso tall and quiet over fast feet.',
  }),
  X('bird_dog', 'Bird Dog', 'brace', 'bodyweight', 1, {
    uni: true,
    bw: true,
    cue: 'On all fours, reach opposite arm and leg, hips stay perfectly level.',
  }),
  X('hollow_hold', 'Hollow Body Hold', 'brace', 'bodyweight', 2, {
    bw: true,
    timed: true,
    hold: [20, 40],
    cue: 'Lower back pressed down, arms and legs long and low, breathe behind the brace.',
  }),
  X('suitcase_carry', 'Suitcase Carry', 'brace', 'dumbbell', 1, {
    uni: true,
    timed: true,
    hold: [30, 45],
    cue: 'Heavy weight in one hand, walk tall without leaning.',
    dance: 'Walking tall against an uneven load, the same job your trunk does in partner work.',
  }),
  X('hanging_knee_raise', 'Hanging Knee Raise', 'brace', 'pullup', 2, {
    bw: true,
    cue: 'From a dead hang, curl the pelvis up and bring the knees to the chest, no swinging.',
  }),
  X('stir_the_pot', 'Stir the Pot', 'brace', 'bodyweight', 2, {
    bw: true,
    cue: 'Forearms on a stability ball, draw slow circles while the body stays still.',
  }),
  X('cable_crunch', 'Cable Crunch', 'brace', 'cable', 1, {
    cue: 'Kneeling, hips still, curl the ribs toward the pelvis.',
  }),
  X('reverse_crunch', 'Reverse Crunch', 'brace', 'bodyweight', 1, {
    bw: true,
    cue: 'Knees bent, curl the hips off the floor, lower one vertebra at a time.',
  }),
  X('ab_wheel', 'Ab Wheel Rollout', 'brace', 'bodyweight', 3, {
    bw: true,
    cue: 'From the knees, roll out as far as you can without the back sagging, pull back with the abs.',
  }),

  // ── Core rotation ────────────────────────────────────────────────────────
  X('pallof', 'Pallof Press', 'rotate', 'cable', 1, {
    uni: true,
    cue: 'Side-on to the cable, press the handle straight out and hold. Do not let it turn you.',
    dance: 'Trains the trunk to resist rotation, the brakes that finish a spin cleanly.',
  }),
  X('woodchop', 'Cable Woodchop', 'rotate', 'cable', 1, {
    uni: true,
    cue: 'High to low across the body, pivot the back foot, arms stay long.',
    dance: 'Rotation that starts at the hips and travels through the ribs, where spin power comes from.',
  }),
  X('cable_lift', 'Cable Lift', 'rotate', 'cable', 2, {
    uni: true,
    cue: 'Low to high across the body, drive from the hips, finish tall.',
  }),
  X('half_kneel_chop', 'Half-Kneeling Chop', 'rotate', 'cable', 2, {
    uni: true,
    cue: 'Inside knee down, hips locked, chop across with the shoulders only.',
    dance: 'Separates upper-body rotation from still hips, the essence of torso isolation.',
  }),
  X('band_rotation', 'Banded Rotation', 'rotate', 'band', 1, {
    uni: true,
    cue: 'Band at chest height, arms long, rotate through the ribs and return under control.',
  }),
  X('band_pallof', 'Banded Pallof Press', 'rotate', 'band', 1, {
    uni: true,
    cue: 'Side-on to the anchor, press out, pause two seconds, return.',
    dance: 'Anti-rotation strength with a band you can keep in your dance bag.',
  }),
  X('russian_twist', 'Russian Twist', 'rotate', 'bodyweight', 1, {
    bw: true,
    cue: 'Lean back with a long spine, rotate the ribs side to side, the hands just follow.',
  }),
  X('side_plank_reach', 'Side Plank Reach-Through', 'rotate', 'bodyweight', 2, {
    uni: true,
    bw: true,
    cue: 'From a side plank, thread the top arm under the body and open back up.',
  }),
  X('landmine_rotation', 'Landmine Rotation', 'rotate', 'barbell', 2, {
    cue: 'Arms long, arc the bar from hip to hip, pivot the feet as you turn.',
  }),
  X('kb_windmill', 'Kettlebell Windmill', 'rotate', 'kettlebell', 3, {
    uni: true,
    cue: 'Bell overhead, eyes on it, push the hip out and slide the free hand down the leg.',
  }),
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
