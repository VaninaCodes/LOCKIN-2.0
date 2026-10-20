(() => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const identity = user?.id ?? user?.email ?? user?.name ?? "local";
  const prefix = `lockin:${encodeURIComponent(String(identity).toLowerCase())}`;
  const SUBJECTS_KEY = `${prefix}:subjects`;
  const PROGRESS_KEY = `${prefix}:subject-progress`;
  const PROFILE_KEY = `${prefix}:profile`;
  const POMODORO_KEY = `${prefix}:pomodoro`;
  const PHOTO_DATABASE = "lockin-profile-assets";
  const PHOTO_STORE = "photos";

  function openPhotoDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PHOTO_DATABASE, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(PHOTO_STORE)) {
          database.createObjectStore(PHOTO_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error || new Error("No se pudo abrir el almacenamiento de fotos."));
      request.onblocked = () =>
        reject(new Error("El almacenamiento de fotos está bloqueado por otra pestaña."));
    });
  }

  async function storePhoto(blob, createUrl = true) {
    const database = await openPhotoDatabase();

    await new Promise((resolve, reject) => {
      const transaction = database.transaction(PHOTO_STORE, "readwrite");
      transaction.objectStore(PHOTO_STORE).put(blob, prefix);
      transaction.oncomplete = resolve;
      transaction.onerror = () =>
        reject(transaction.error || new Error("No se pudo guardar la foto."));
      transaction.onabort = () =>
        reject(transaction.error || new Error("Se canceló el guardado de la foto."));
    }).finally(() => database.close());

    return createUrl ? URL.createObjectURL(blob) : null;
  }

  async function readStoredPhoto() {
    const database = await openPhotoDatabase();

    const photo = await new Promise((resolve, reject) => {
      const transaction = database.transaction(PHOTO_STORE, "readonly");
      const request = transaction.objectStore(PHOTO_STORE).get(prefix);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () =>
        reject(request.error || new Error("No se pudo leer la foto guardada."));
    }).finally(() => database.close());

    return photo ? URL.createObjectURL(photo) : null;
  }

  function read(key) {
    const value = localStorage.getItem(key);
    if (!value) return {};

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`No se pudieron leer los datos guardados (${key}).`, error);
      return {};
    }
  }

  function readSubjects() {
    const value = read(SUBJECTS_KEY);
    return Array.isArray(value) ? value : [];
  }

  function saveSubjects(subjects) {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  }

  function readProgress() {
    const value = read(PROGRESS_KEY);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function addStudySeconds(subjectId, seconds) {
    if (!subjectId || seconds <= 0) return;

    const progress = readProgress();
    const subjectProgress = progress[subjectId] || { seconds: 0 };
    subjectProgress.seconds = (Number(subjectProgress.seconds) || 0) + seconds;
    progress[subjectId] = subjectProgress;
    saveProgress(progress);
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  async function readProfile() {
    const profile = read(PROFILE_KEY);
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return {};
    }

    if (typeof profile.foto === "string" && profile.foto.startsWith("data:")) {
      const response = await fetch(profile.foto);
      const photo = await response.blob();
      await storePhoto(photo, false);
      delete profile.foto;
      saveProfile(profile);
    }

    return profile;
  }

  function readUser() {
    const user = read("user");
    return user && typeof user === "object" && !Array.isArray(user) ? user : {};
  }

  async function saveProfile(profile) {
    const profileToSave = { ...profile };
    if (typeof profileToSave.foto === "string" && profileToSave.foto.startsWith("data:")) {
      const response = await fetch(profileToSave.foto);
      await storePhoto(await response.blob(), false);
    }
    delete profileToSave.foto;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileToSave));
  }

  async function saveProfilePhoto(file) {
    return storePhoto(file);
  }

  async function readProfilePhoto() {
    return readStoredPhoto();
  }

  function addStudySecond(subjectId) {
    addStudySeconds(subjectId, 1);
  }

  function getPomodoroState() {
    const value = sessionStorage.getItem(POMODORO_KEY);
    if (!value) return null;

    try {
      const state = JSON.parse(value);
      return state && typeof state === "object" ? state : null;
    } catch (error) {
      console.error("No se pudo leer el estado del Pomodoro.", error);
      return null;
    }
  }

  function savePomodoroState(state) {
    sessionStorage.setItem(POMODORO_KEY, JSON.stringify(state));
  }

  function clearPomodoroState() {
    sessionStorage.removeItem(POMODORO_KEY);
  }

  function advancePomodoro(now = Date.now()) {
    const state = getPomodoroState();
    if (!state || !state.running) return state;

    const elapsedSeconds = Math.floor((now - state.lastUpdatedAt) / 1000);
    if (elapsedSeconds <= 0) return state;

    let secondsRemaining = state.secondsRemaining;
    let currentSet = state.currentSet;
    let isBreak = state.isBreak;
    let studySeconds = 0;
    let remainingTicks = elapsedSeconds;

    while (remainingTicks > 0 && state.running) {
      const ticksToPhaseEnd = Math.min(remainingTicks, secondsRemaining);
      if (!isBreak) studySeconds += ticksToPhaseEnd;
      secondsRemaining -= ticksToPhaseEnd;
      remainingTicks -= ticksToPhaseEnd;

      if (secondsRemaining === 0) {
        if (!isBreak) {
          isBreak = true;
          secondsRemaining = state.breakMinutes * 60;
        } else {
          currentSet += 1;
          if (currentSet > state.totalSets) {
            state.running = false;
            state.completed = true;
            secondsRemaining = 0;
          } else {
            isBreak = false;
            secondsRemaining = state.studyMinutes * 60;
          }
        }
      }
    }

    if (studySeconds > 0) {
      addStudySeconds(state.subjectId, studySeconds);
      state.elapsedStudySeconds =
        (Number(state.elapsedStudySeconds) || 0) + studySeconds;
    }

    state.secondsRemaining = secondsRemaining;
    state.currentSet = currentSet;
    state.isBreak = isBreak;
    state.lastUpdatedAt += elapsedSeconds * 1000;
    savePomodoroState(state);
    return state;
  }

  function pausePomodoro(now = Date.now()) {
    const state = advancePomodoro(now);
    if (!state) return null;
    state.running = false;
    state.lastUpdatedAt = now;
    savePomodoroState(state);
    return state;
  }

  function resumePomodoro(now = Date.now()) {
    const state = getPomodoroState();
    if (!state || state.completed) return state;
    state.running = true;
    state.lastUpdatedAt = now;
    savePomodoroState(state);
    return state;
  }

  function removeProgress(subjectId) {
    const progress = readProgress();
    delete progress[subjectId];
    saveProgress(progress);
  }

  window.LockInStudyData = {
    readSubjects,
    saveSubjects,
    readProgress,
    saveProgress,
    addStudySeconds,
    readProfile,
    saveProfile,
    saveProfilePhoto,
    readProfilePhoto,
    readUser,
    addStudySecond,
    getPomodoroState,
    savePomodoroState,
    clearPomodoroState,
    advancePomodoro,
    pausePomodoro,
    resumePomodoro,
    removeProgress,
  };

  let internalNavigationPending = false;

  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element ? event.target : event.target.parentElement;
      const link = target?.closest("a[href]");
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (link.target && link.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        /\/(?:index|perfil)\.html$/i.test(destination.pathname)
      ) {
        internalNavigationPending = true;
      }
    },
    true,
  );

  window.addEventListener("pageshow", () => {
    internalNavigationPending = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    if (internalNavigationPending) {
      internalNavigationPending = false;
      return;
    }

    const state = getPomodoroState();
    if (!state?.running) return;

    if (!state.isBreak) {
      sessionStorage.setItem("lockin_reto_pendiente", "true");
    }
    pausePomodoro();
  });
})();
