/* SU SU Apple Health bridge v1
   Privacy-first: receives a compact JSON payload in the URL fragment (#health=...)
   so health data is not sent to GitHub Pages. Existing SU SU storage key stays "susu".
*/
(() => {
  'use strict';
  const KEY = 'susu';
  const BACKUP_KEY = 'susu-health-import-backup';
  const HEALTH_SCHEMA = 1;
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const validDay = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
  const uniq = xs => [...new Set((xs || []).filter(Boolean).map(String))];

  function blankHealth() {
    return {
      steps:0, activeKcal:0, distanceKm:0, exerciseMin:0, sleepMin:0,
      restingHr:0, heartRate:0, weightKg:0, bodyFatPct:0, bmi:0,
      workouts:[], source:null, sources:[], updatedAt:null
    };
  }

  function blankDay() {
    return {pushEvents:[], pullEvents:[], meals:[], activityEvents:[], health:blankHealth()};
  }

  function safeWorkout(w, fallbackSource) {
    if (!w || typeof w !== 'object') return null;
    return {
      id:String(w.id || [w.type,w.startDate,w.endDate].join('|')),
      type:String(w.type || 'Entrenamiento'),
      startDate:w.startDate || null,
      endDate:w.endDate || null,
      durationMin:Math.max(0,num(w.durationMin)),
      activeKcal:Math.max(0,num(w.activeKcal)),
      distanceKm:Math.max(0,num(w.distanceKm)),
      source:String(w.source || fallbackSource)
    };
  }

  function upsertBodyMeasurement(state, x, source, now) {
    const weight = Math.max(0,num(x.weightKg));
    const fat = Math.max(0,num(x.bodyFatPct));
    const bmi = Math.max(0,num(x.bmi));
    if (!weight && !fat && !bmi) return;

    state.checkins = Array.isArray(state.checkins) ? state.checkins : [];
    let existing = [...state.checkins].reverse()
      .find(c => c && c.date === x.date && c.healthImported === true);

    if (!existing) {
      existing = {
        id:'health-' + [x.date,source].join('-').replace(/[^a-z0-9-]/gi,'_'),
        date:x.date, weight:'', waist:'', chest:'', arm:'', photos:[],
        healthImported:true
      };
      state.checkins.push(existing);
    }
    if (weight) existing.weight = weight;
    if (fat) existing.bodyFat = fat;
    if (bmi) existing.bmi = bmi;
    existing.healthSource = source;
    existing.healthUpdatedAt = now;
  }

  function importPayload(payload) {
    if (!payload || Number(payload.schemaVersion) !== HEALTH_SCHEMA || !Array.isArray(payload.days)) {
      throw new Error('Formato de Salud no válido');
    }

    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : {};
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Datos SU SU no válidos');

    const backup = JSON.stringify(state);
    state.days = state.days && typeof state.days === 'object' ? state.days : {};
    state.healthSync = state.healthSync && typeof state.healthSync === 'object' ? state.healthSync : {};
    const now = new Date().toISOString();
    const allSources = new Set(state.healthSync.sources || []);
    let count = 0;

    for (const x of payload.days) {
      if (!x || !validDay(x.date)) continue;
      const source = String(x.source || payload.source || 'Apple Health');
      allSources.add(source);

      const d = state.days[x.date] && typeof state.days[x.date] === 'object'
        ? state.days[x.date] : blankDay();
      d.pushEvents = Array.isArray(d.pushEvents) ? d.pushEvents : [];
      d.pullEvents = Array.isArray(d.pullEvents) ? d.pullEvents : [];
      d.meals = Array.isArray(d.meals) ? d.meals : [];
      d.activityEvents = Array.isArray(d.activityEvents) ? d.activityEvents : [];

      const prev = d.health && typeof d.health === 'object' ? d.health : blankHealth();
      const workouts = Array.isArray(x.workouts)
        ? x.workouts.map(w => safeWorkout(w,source)).filter(Boolean) : [];

      // Replace the aggregate for the same day instead of adding it.
      // This makes repeated Shortcut runs idempotent and avoids double counting.
      d.health = {
        ...prev,
        steps:Math.max(0,num(x.steps)),
        activeKcal:Math.max(0,num(x.activeKcal)),
        distanceKm:Math.max(0,num(x.distanceKm)),
        exerciseMin:Math.max(0,num(x.exerciseMin)),
        sleepMin:Math.max(0,num(x.sleepMin)),
        restingHr:Math.max(0,num(x.restingHr)),
        heartRate:Math.max(0,num(x.heartRate)),
        weightKg:Math.max(0,num(x.weightKg)),
        bodyFatPct:Math.max(0,num(x.bodyFatPct)),
        bmi:Math.max(0,num(x.bmi)),
        workouts,
        source,
        sources:uniq(Array.isArray(x.sources) ? x.sources : [source]),
        updatedAt:now
      };
      state.days[x.date] = d;
      upsertBodyMeasurement(state,x,source,now);
      count++;
    }

    state.healthSync = {
      ...state.healthSync,
      provider:'apple-health',
      watch:state.healthSync.watch || 'Amazfit GTR 4',
      scale:state.healthSync.scale || 'Xiaomi S400',
      connected:true,
      lastSync:payload.generatedAt || now,
      lastImportCount:count,
      sources:uniq([...allSources])
    };

    localStorage.setItem(BACKUP_KEY, backup);
    localStorage.setItem(KEY, JSON.stringify(state));
    return count;
  }

  function decodePayload(encoded) {
    // Shortcut may send either percent-encoded JSON or URL-safe base64 JSON.
    try { return JSON.parse(decodeURIComponent(encoded)); } catch (_) {}
    const b64 = encoded.replace(/-/g,'+').replace(/_/g,'/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function consumeLaunchPayload() {
    const hash = location.hash || '';
    if (!hash.startsWith('#health=')) return;
    const encoded = hash.slice(8);
    try {
      const count = importPayload(decodePayload(encoded));
      sessionStorage.setItem('susu-health-import-result', JSON.stringify({ok:true,count,at:new Date().toISOString()}));
    } catch (e) {
      console.error('SU SU Health import failed', e);
      sessionStorage.setItem('susu-health-import-result', JSON.stringify({ok:false,error:String(e?.message || e)}));
    } finally {
      history.replaceState({},'',location.pathname + location.search);
    }
  }

  // Must run before app.js reads localStorage.
  consumeLaunchPayload();

  // Tiny public API for testing from Safari dev tools / future native wrapper.
  window.SUSUHealthBridge = { importPayload };
})();
