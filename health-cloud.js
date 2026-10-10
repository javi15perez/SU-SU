// Public PWA integration. Configure the private read token on the device.
function installHealthSync({ onImport, getLastExport = () => '', mount = document.body }) {
  if (typeof onImport !== 'function') throw new Error('Provide the existing SU SU JSON importer as onImport.');
  const endpoint = 'https://susu-health-sync.javiperezespanol.workers.dev/v1/health';
  const storageKey = 'susu.health.read-token.v1';
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', 'Sincronización de Apple Salud');
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const sync = document.createElement('button'); sync.type = 'button'; sync.textContent = 'Sincronizar ahora';
  const retrieve = document.createElement('button'); retrieve.type = 'button'; retrieve.textContent = 'Recuperar último envío';
  const form = document.createElement('form');
  const label = document.createElement('label'); label.textContent = 'Clave privada de lectura ';
  const input = document.createElement('input'); input.type = 'password'; input.autocomplete = 'off'; input.spellcheck = false;
  label.append(input);
  const remember = document.createElement('input'); remember.type = 'checkbox';
  const rememberLabel = document.createElement('label'); rememberLabel.append(remember, ' Recordar en este iPhone');
  const save = document.createElement('button'); save.type = 'submit'; save.textContent = 'Conectar';
  const forget = document.createElement('button'); forget.type = 'button'; forget.textContent = 'Olvidar clave';
  input.className = 'input'; save.className = sync.className = 'primary'; retrieve.className = forget.className = 'secondary'; status.className = 'note';
  const privacy = document.createElement('p'); privacy.className = 'note'; privacy.textContent = 'Recordar guarda la clave de lectura en este dispositivo. Cualquier script del mismo sitio podría leerla. La clave de envío solo debe estar en tu Atajo.';
  form.append(label, rememberLabel, privacy, save); panel.append(form, sync, retrieve, forget, status); mount.append(panel);
  let token = ''; try { token = localStorage.getItem(storageKey) || ''; } catch {}
  let busy = false, lastAttempt = 0, lastReceived = '', generation = 0, returningFromShortcut = false;
  const messages = { unauthorized: 'La clave de lectura no es válida.', no_data: 'Todavía no hay datos. Ejecuta el Atajo en el iPhone.', configuration_missing: 'Falta configurar el Worker.', temporarily_unavailable: 'Datos pendientes de propagación. Prueba de nuevo en un minuto.' };
  async function refresh(manual = false) {
    if (busy || (!manual && Date.now() - lastAttempt < 60000)) return;
    if (!token) { form.hidden = false; status.textContent = 'Introduce tu clave privada de lectura para conectar.'; return; }
    busy = true; lastAttempt = Date.now(); retrieve.disabled = true; status.textContent = 'Recuperando el último envío…';
    const currentGeneration = generation;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(messages[data.error] || 'No se ha podido sincronizar. Conservamos tus datos actuales.');
      if (currentGeneration !== generation) return;
      if (data.schemaVersion !== 1 || data.source !== 'Apple Health' || !Array.isArray(data.days) || !Number.isFinite(Date.parse(data.receivedAt)) || !Number.isFinite(Date.parse(data.exportedAt))) throw new Error('Respuesta inválida. Conservamos tus datos actuales.');
      if (Date.now() - Date.parse(data.exportedAt) > 48 * 3600000) throw new Error('El último envío tiene más de 48 horas. Ejecuta el Atajo para actualizarlo.');
      const watermark = getLastExport() || lastReceived;
      if (!watermark || data.exportedAt > watermark) {
        await onImport({ schemaVersion: 1, source: 'Apple Health', days: data.days, exportedAt: data.exportedAt, receivedAt: data.receivedAt });
        lastReceived = data.exportedAt;
      } else lastReceived = watermark;
      status.textContent = `Último envío recibido: ${new Date(lastReceived).toLocaleString()}. Si acabas de ejecutar el Atajo, espera un minuto y vuelve a sincronizar.`;
      form.hidden = true;
    } catch (error) { if (currentGeneration === generation) status.textContent = error.name === 'AbortError' ? 'La conexión ha tardado demasiado. Prueba de nuevo.' : (error instanceof TypeError ? 'Sin conexión. Conservamos tus datos actuales.' : error.message); }
    finally { clearTimeout(timeout); busy = false; retrieve.disabled = false; }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!/^[A-Za-z0-9_-]{43}$/.test(input.value.trim())) { status.textContent = 'La clave debe tener 43 caracteres.'; return; }
    generation++; token = input.value.trim(); input.value = ''; lastReceived = '';
    try { if (remember.checked) localStorage.setItem(storageKey, token); else localStorage.removeItem(storageKey); } catch { status.textContent = 'La clave solo se conservará mientras la aplicación esté abierta.'; }
    void refresh(true);
  });
  forget.addEventListener('click', () => { generation++; token = ''; lastReceived = ''; try { localStorage.removeItem(storageKey); } catch {} form.hidden = false; status.textContent = 'Clave olvidada. Los datos ya importados permanecen en SU SU.'; });
  function launchShortcut() {
    returningFromShortcut = true;
    status.textContent = 'Ejecuta el Atajo y vuelve a SU SU. Recuperaremos su envío al regresar.';
    window.location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent('Buscar muestras de Salud');
  }
  sync.addEventListener('click', launchShortcut);
  retrieve.addEventListener('click', () => void refresh(true));
  const visible = () => {
    if (document.visibilityState !== 'visible') return;
    const force = returningFromShortcut; returningFromShortcut = false;
    void refresh(force);
    if (force) setTimeout(() => { if (document.visibilityState === 'visible') void refresh(true); }, 65000);
  };
  document.addEventListener('visibilitychange', visible);
  window.addEventListener('pageshow', visible);
  form.hidden = Boolean(token); void refresh();
  return { refresh: () => refresh(true), launchShortcut, element: panel };
}
window.installHealthSync = installHealthSync;
