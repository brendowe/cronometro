const stopwatch = new Stopwatch();
const minutesEl = document.querySelector("#minutes");
const secondsEl = document.querySelector("#seconds");
const millisecondsEl = document.querySelector("#milliseconds");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");

let animationFrameId = 0;

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

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrameId);
});

renderTime();
renderStatus();
