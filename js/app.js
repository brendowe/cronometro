const stopwatch = new Stopwatch();
const minutesEl = document.querySelector("#minutes");
const secondsEl = document.querySelector("#seconds");
const millisecondsEl = document.querySelector("#milliseconds");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");

const tabButtons = Array.from(document.querySelectorAll(".tab-nav__button"));
const panels = {
  stopwatch: document.querySelector("#panel-stopwatch"),
  timer: document.querySelector("#panel-timer"),
  pomodoro: document.querySelector("#panel-pomodoro"),
};

const timerHoursInput = document.querySelector("#timerHours");
const timerMinutesInput = document.querySelector("#timerMinutes");
const timerSecondsInput = document.querySelector("#timerSeconds");
const timerHoursDisplayEl = document.querySelector("#timerHoursDisplay");
const timerMinutesDisplayEl = document.querySelector("#timerMinutesDisplay");
const timerSecondsDisplayEl = document.querySelector("#timerSecondsDisplay");
const timerStatusEl = document.querySelector("#timerStatus");
const timerStartButton = document.querySelector("#timerStartButton");
const timerPauseButton = document.querySelector("#timerPauseButton");
const timerResetButton = document.querySelector("#timerResetButton");
const timerStepperButtons = Array.from(
  document.querySelectorAll(".stepper__button[data-target][data-step]"),
);

const pomoTotalHoursInput = document.querySelector("#pomoTotalHours");
const pomoTotalMinutesInput = document.querySelector("#pomoTotalMinutes");
const pomoHoursDisplayEl = document.querySelector("#pomoHoursDisplay");
const pomoMinutesDisplayEl = document.querySelector("#pomoMinutesDisplay");
const pomoSecondsDisplayEl = document.querySelector("#pomoSecondsDisplay");
const pomoStatusEl = document.querySelector("#pomoStatus");
const pomoProgressEl = document.querySelector("#pomoProgress");
const pomoStartButton = document.querySelector("#pomoStartButton");
const pomoPauseButton = document.querySelector("#pomoPauseButton");
const pomoResetButton = document.querySelector("#pomoResetButton");
const pomoStudyOptions = Array.from(
  document.querySelectorAll("#pomoStudyOptions .option-btn"),
);
const pomoBreakOptions = Array.from(
  document.querySelectorAll("#pomoBreakOptions .option-btn"),
);

let animationFrameId = 0;
const APP_MS_PER_SECOND = 1000;
const APP_MS_PER_MINUTE = 60 * APP_MS_PER_SECOND;
const APP_MS_PER_HOUR = 60 * APP_MS_PER_MINUTE;

let audioContext;

const timerState = {
  durationMs: 0,
  remainingMs: 0,
  running: false,
  finished: false,
  lastTick: 0,
  animationFrameId: 0,
};

const pomodoroState = {
  studyMinutes: 25,
  breakMinutes: 5,
  targetFocusMs: 0,
  completedFocusMs: 0,
  currentPhase: "idle",
  currentPhaseTotalMs: 25 * APP_MS_PER_MINUTE,
  remainingMs: 25 * APP_MS_PER_MINUTE,
  running: false,
  lastTick: 0,
  animationFrameId: 0,
};

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(panels).forEach(([panelName, panel]) => {
    panel.classList.toggle("is-active", panelName === tabName);
  });
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function formatHhMmSs(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / APP_MS_PER_SECOND));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatHoursMinutes(milliseconds) {
  const totalMinutes = Math.max(
    0,
    Math.floor(milliseconds / APP_MS_PER_MINUTE),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();
  return audioContext;
}

function playTimerHornAlert() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  const now = context.currentTime;

  for (let i = 0; i < 10; i += 1) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = now + i * 0.19;
    const endAt = startAt + 0.16;

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(420, startAt);
    oscillator.frequency.linearRampToValueAtTime(680, endAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.52, startAt + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }
}

function playPomodoroBreakAlert() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  const now = context.currentTime;

  for (let i = 0; i < 3; i += 1) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = now + i * 0.24;
    const endAt = startAt + 0.2;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(740, startAt);
    oscillator.frequency.linearRampToValueAtTime(980, endAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.26, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }
}

function playPomodoroStudyAlert() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    context.resume();
  }

  const now = context.currentTime;

  for (let i = 0; i < 2; i += 1) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = now + i * 0.28;
    const endAt = startAt + 0.24;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(980, startAt);
    oscillator.frequency.linearRampToValueAtTime(680, endAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.24, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }
}

function changeNumberInputByStep(input, step) {
  if (!input) {
    return;
  }

  const min = Number.parseInt(input.min, 10);
  const max = Number.parseInt(input.max, 10);
  const currentValue = Number.parseInt(input.value, 10);
  const safeCurrent = Number.isFinite(currentValue)
    ? currentValue
    : Number.isFinite(min)
      ? min
      : 0;

  let nextValue = safeCurrent + step;

  if (Number.isFinite(min)) {
    nextValue = Math.max(min, nextValue);
  }

  if (Number.isFinite(max)) {
    nextValue = Math.min(max, nextValue);
  }

  input.value = String(nextValue);
}

function renderTime() {
  const time = formatTime(stopwatch.getTime());
  minutesEl.textContent = time.minutes;
  secondsEl.textContent = time.seconds;
  millisecondsEl.textContent = time.milliseconds;
}

function renderStatus() {
  if (stopwatch.running) {
    startButton.disabled = true;
    pauseButton.disabled = false;
    return;
  }

  startButton.disabled = false;
  pauseButton.disabled = true;
}

function getTimerInputMilliseconds() {
  const hours = clampNumber(Number.parseInt(timerHoursInput.value, 10), 0, 99);
  const minutes = clampNumber(
    Number.parseInt(timerMinutesInput.value, 10),
    0,
    59,
  );
  const seconds = clampNumber(
    Number.parseInt(timerSecondsInput.value, 10),
    0,
    59,
  );

  timerHoursInput.value = String(hours);
  timerMinutesInput.value = String(minutes);
  timerSecondsInput.value = String(seconds);

  return (
    hours * APP_MS_PER_HOUR +
    minutes * APP_MS_PER_MINUTE +
    seconds * APP_MS_PER_SECOND
  );
}

function renderTimerDisplay() {
  const [hours, minutes, seconds] = formatHhMmSs(timerState.remainingMs).split(
    ":",
  );
  timerHoursDisplayEl.textContent = hours;
  timerMinutesDisplayEl.textContent = minutes;
  timerSecondsDisplayEl.textContent = seconds;
}

function renderTimerControls() {
  timerStartButton.disabled = timerState.running || timerState.remainingMs <= 0;
  timerPauseButton.disabled = !timerState.running;
}

function renderTimerStatus(message) {
  if (message) {
    timerStatusEl.textContent = message;
    return;
  }

  if (timerState.running) {
    timerStatusEl.textContent = "Contagem regressiva em andamento.";
    return;
  }

  if (timerState.finished) {
    timerStatusEl.textContent = "Tempo encerrado.";
    return;
  }

  timerStatusEl.textContent = "Defina o tempo e inicie.";
}

function renderTimer() {
  renderTimerDisplay();
  renderTimerControls();
  renderTimerStatus();
}

function onTimerFinished() {
  timerState.running = false;
  timerState.finished = true;
  timerState.remainingMs = 0;
  window.cancelAnimationFrame(timerState.animationFrameId);
  playTimerHornAlert();
  renderTimerDisplay();
  renderTimerControls();
  renderTimerStatus("Tempo concluido. Alarme tocando.");
}

function updateTimer(now) {
  if (!timerState.running) {
    return;
  }

  const delta = now - timerState.lastTick;
  timerState.lastTick = now;
  timerState.remainingMs = Math.max(0, timerState.remainingMs - delta);

  if (timerState.remainingMs <= 0) {
    onTimerFinished();
    return;
  }

  renderTimerDisplay();
  timerState.animationFrameId = window.requestAnimationFrame(updateTimer);
}

function startTimer() {
  if (timerState.running) {
    return;
  }

  if (timerState.remainingMs <= 0) {
    timerState.durationMs = getTimerInputMilliseconds();
    timerState.remainingMs = timerState.durationMs;
  }

  if (timerState.remainingMs <= 0) {
    renderTimerStatus("Informe um tempo maior que zero.");
    renderTimerControls();
    return;
  }

  timerState.finished = false;
  timerState.running = true;
  timerState.lastTick = performance.now();
  renderTimer();
  window.cancelAnimationFrame(timerState.animationFrameId);
  timerState.animationFrameId = window.requestAnimationFrame(updateTimer);
}

function pauseTimer() {
  if (!timerState.running) {
    return;
  }

  timerState.running = false;
  window.cancelAnimationFrame(timerState.animationFrameId);
  renderTimerDisplay();
  renderTimerControls();
  renderTimerStatus("Temporizador pausado.");
}

function resetTimer() {
  timerState.running = false;
  timerState.finished = false;
  timerState.durationMs = getTimerInputMilliseconds();
  timerState.remainingMs = timerState.durationMs;
  window.cancelAnimationFrame(timerState.animationFrameId);
  renderTimer();
}

function getPomodoroTargetMilliseconds() {
  const hours = clampNumber(
    Number.parseInt(pomoTotalHoursInput.value, 10),
    0,
    24,
  );
  const minutes = clampNumber(
    Number.parseInt(pomoTotalMinutesInput.value, 10),
    0,
    59,
  );

  pomoTotalHoursInput.value = String(hours);
  pomoTotalMinutesInput.value = String(minutes);

  return hours * APP_MS_PER_HOUR + minutes * APP_MS_PER_MINUTE;
}

function setActiveOption(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function preparePomodoroStudyPhase() {
  const pendingFocusMs = Math.max(
    0,
    pomodoroState.targetFocusMs - pomodoroState.completedFocusMs,
  );
  const desiredStudyMs = pomodoroState.studyMinutes * APP_MS_PER_MINUTE;
  const studyMs = Math.min(desiredStudyMs, pendingFocusMs);

  pomodoroState.currentPhase = "study";
  pomodoroState.currentPhaseTotalMs = studyMs;
  pomodoroState.remainingMs = studyMs;
}

function preparePomodoroBreakPhase() {
  const breakMs = pomodoroState.breakMinutes * APP_MS_PER_MINUTE;
  pomodoroState.currentPhase = "break";
  pomodoroState.currentPhaseTotalMs = breakMs;
  pomodoroState.remainingMs = breakMs;
}

function getPomodoroStatusText() {
  if (pomodoroState.currentPhase === "done") {
    return "Meta total de foco concluida.";
  }

  if (pomodoroState.running) {
    return pomodoroState.currentPhase === "study"
      ? "Sessao de estudo em andamento."
      : "Hora do descanso.";
  }

  if (
    pomodoroState.currentPhase === "study" ||
    pomodoroState.currentPhase === "break"
  ) {
    return "Pomodoro pausado.";
  }

  return "Pronto para iniciar o foco.";
}

function renderPomodoro() {
  const [hours, minutes, seconds] = formatHhMmSs(
    pomodoroState.remainingMs,
  ).split(":");
  pomoHoursDisplayEl.textContent = hours;
  pomoMinutesDisplayEl.textContent = minutes;
  pomoSecondsDisplayEl.textContent = seconds;
  pomoProgressEl.textContent = `Foco concluido: ${formatHoursMinutes(pomodoroState.completedFocusMs)} / ${formatHoursMinutes(pomodoroState.targetFocusMs)}`;
  pomoStatusEl.textContent = getPomodoroStatusText();

  const canStart = !pomodoroState.running && pomodoroState.targetFocusMs > 0;
  pomoStartButton.disabled = !canStart;
  pomoPauseButton.disabled = !pomodoroState.running;

  const shouldResume =
    !pomodoroState.running &&
    (pomodoroState.currentPhase === "study" ||
      pomodoroState.currentPhase === "break") &&
    pomodoroState.remainingMs > 0;

  pomoStartButton.textContent = shouldResume ? "Retomar" : "Iniciar";
}

function onPomodoroPhaseComplete() {
  if (pomodoroState.currentPhase === "study") {
    pomodoroState.completedFocusMs = Math.min(
      pomodoroState.targetFocusMs,
      pomodoroState.completedFocusMs + pomodoroState.currentPhaseTotalMs,
    );

    if (pomodoroState.completedFocusMs >= pomodoroState.targetFocusMs) {
      pomodoroState.running = false;
      pomodoroState.currentPhase = "done";
      pomodoroState.remainingMs = 0;
      playTimerHornAlert();
      renderPomodoro();
      return;
    }

    preparePomodoroBreakPhase();
    playPomodoroBreakAlert();
    pomodoroState.lastTick = performance.now();
    renderPomodoro();
    return;
  }

  if (pomodoroState.currentPhase === "break") {
    preparePomodoroStudyPhase();
    playPomodoroStudyAlert();
    pomodoroState.lastTick = performance.now();
    renderPomodoro();
  }
}

function updatePomodoro(now) {
  if (!pomodoroState.running) {
    return;
  }

  const delta = now - pomodoroState.lastTick;
  pomodoroState.lastTick = now;
  pomodoroState.remainingMs = Math.max(0, pomodoroState.remainingMs - delta);

  if (pomodoroState.remainingMs <= 0) {
    onPomodoroPhaseComplete();

    if (!pomodoroState.running) {
      return;
    }
  }

  const [hours, minutes, seconds] = formatHhMmSs(
    pomodoroState.remainingMs,
  ).split(":");
  pomoHoursDisplayEl.textContent = hours;
  pomoMinutesDisplayEl.textContent = minutes;
  pomoSecondsDisplayEl.textContent = seconds;
  pomodoroState.animationFrameId = window.requestAnimationFrame(updatePomodoro);
}

function startPomodoro() {
  if (pomodoroState.running) {
    return;
  }

  pomodoroState.targetFocusMs = getPomodoroTargetMilliseconds();

  if (pomodoroState.targetFocusMs <= 0) {
    renderPomodoro();
    pomoStatusEl.textContent = "Defina um foco total maior que zero.";
    return;
  }

  if (
    pomodoroState.currentPhase === "idle" ||
    pomodoroState.currentPhase === "done" ||
    pomodoroState.completedFocusMs >= pomodoroState.targetFocusMs
  ) {
    pomodoroState.completedFocusMs = 0;
    preparePomodoroStudyPhase();
  }

  if (pomodoroState.remainingMs <= 0) {
    if (pomodoroState.currentPhase === "study") {
      preparePomodoroStudyPhase();
    } else {
      preparePomodoroBreakPhase();
    }
  }

  pomodoroState.running = true;
  pomodoroState.lastTick = performance.now();
  renderPomodoro();
  window.cancelAnimationFrame(pomodoroState.animationFrameId);
  pomodoroState.animationFrameId = window.requestAnimationFrame(updatePomodoro);
}

function pausePomodoro() {
  if (!pomodoroState.running) {
    return;
  }

  pomodoroState.running = false;
  window.cancelAnimationFrame(pomodoroState.animationFrameId);
  renderPomodoro();
}

function resetPomodoro() {
  pomodoroState.running = false;
  window.cancelAnimationFrame(pomodoroState.animationFrameId);
  pomodoroState.targetFocusMs = getPomodoroTargetMilliseconds();
  pomodoroState.completedFocusMs = 0;
  pomodoroState.currentPhase = "idle";
  pomodoroState.currentPhaseTotalMs =
    pomodoroState.studyMinutes * APP_MS_PER_MINUTE;
  pomodoroState.remainingMs = pomodoroState.currentPhaseTotalMs;
  renderPomodoro();
}

function onTimerInputChanged() {
  if (timerState.running) {
    return;
  }

  timerState.finished = false;
  timerState.durationMs = getTimerInputMilliseconds();
  timerState.remainingMs = timerState.durationMs;
  renderTimer();
}

function onPomodoroTargetChanged() {
  if (pomodoroState.running) {
    return;
  }

  pomodoroState.targetFocusMs = getPomodoroTargetMilliseconds();
  renderPomodoro();
}

function update() {
  stopwatch.tick();
  renderTime();
  if (stopwatch.running) {
    animationFrameId = window.requestAnimationFrame(update);
  }
}

function startStopwatch() {
  stopwatch.start();
  renderStatus();
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = window.requestAnimationFrame(update);
}

function pauseStopwatch() {
  stopwatch.pause();
  window.cancelAnimationFrame(animationFrameId);
  renderTime();
  renderStatus();
}

function resetStopwatch() {
  stopwatch.reset();
  window.cancelAnimationFrame(animationFrameId);
  renderTime();
  renderStatus();
}

startButton.addEventListener("click", startStopwatch);
pauseButton.addEventListener("click", pauseStopwatch);
resetButton.addEventListener("click", resetStopwatch);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

timerStartButton.addEventListener("click", startTimer);
timerPauseButton.addEventListener("click", pauseTimer);
timerResetButton.addEventListener("click", resetTimer);

[timerHoursInput, timerMinutesInput, timerSecondsInput].forEach((input) => {
  input.addEventListener("input", onTimerInputChanged);
});

timerStepperButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { target, step } = button.dataset;
    const input = document.querySelector(`#${target}`);
    const parsedStep = Number.parseInt(step, 10);

    if (!input || !Number.isFinite(parsedStep)) {
      return;
    }

    if (target.startsWith("timer")) {
      if (timerState.running) {
        return;
      }

      changeNumberInputByStep(input, parsedStep);
      onTimerInputChanged();
      return;
    }

    if (target.startsWith("pomoTotal")) {
      if (pomodoroState.running) {
        return;
      }

      changeNumberInputByStep(input, parsedStep);
      onPomodoroTargetChanged();
    }
  });
});

pomoStudyOptions.forEach((button) => {
  button.addEventListener("click", () => {
    pomodoroState.studyMinutes = Number.parseInt(button.dataset.study, 10);
    setActiveOption(pomoStudyOptions, button);

    if (!pomodoroState.running) {
      pomodoroState.currentPhaseTotalMs =
        pomodoroState.studyMinutes * APP_MS_PER_MINUTE;

      if (
        pomodoroState.currentPhase === "idle" ||
        pomodoroState.currentPhase === "done"
      ) {
        pomodoroState.remainingMs = pomodoroState.currentPhaseTotalMs;
      }

      renderPomodoro();
    }
  });
});

pomoBreakOptions.forEach((button) => {
  button.addEventListener("click", () => {
    pomodoroState.breakMinutes = Number.parseInt(button.dataset.break, 10);
    setActiveOption(pomoBreakOptions, button);

    if (!pomodoroState.running) {
      renderPomodoro();
    }
  });
});

pomoStartButton.addEventListener("click", startPomodoro);
pomoPauseButton.addEventListener("click", pausePomodoro);
pomoResetButton.addEventListener("click", resetPomodoro);

[pomoTotalHoursInput, pomoTotalMinutesInput].forEach((input) => {
  input.addEventListener("input", onPomodoroTargetChanged);
});

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrameId);
  window.cancelAnimationFrame(timerState.animationFrameId);
  window.cancelAnimationFrame(pomodoroState.animationFrameId);
});

timerState.durationMs = getTimerInputMilliseconds();
timerState.remainingMs = timerState.durationMs;

pomodoroState.targetFocusMs = getPomodoroTargetMilliseconds();

renderTime();
renderStatus();
renderTimer();
renderPomodoro();
