const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;

function formatTime(milliseconds) {
  const totalMilliseconds = Math.max(0, Math.floor(milliseconds));
  const minutes = Math.floor(totalMilliseconds / MILLISECONDS_PER_MINUTE);
  const seconds = Math.floor(
    (totalMilliseconds % MILLISECONDS_PER_MINUTE) / MILLISECONDS_PER_SECOND,
  );
  const centiseconds = Math.floor(
    (totalMilliseconds % MILLISECONDS_PER_SECOND) / 10,
  );

  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    milliseconds: String(centiseconds).padStart(2, "0"),
  };
}

class Stopwatch {
  constructor() {
    this.elapsed = 0;
    this.running = false;
    this.startedAt = 0;
  }

  start() {
    if (this.running) {
      return this.elapsed;
    }

    this.running = true;
    this.startedAt = performance.now() - this.elapsed;
    return this.elapsed;
  }

  pause() {
    if (!this.running) {
      return this.elapsed;
    }

    this.elapsed = performance.now() - this.startedAt;
    this.running = false;
    this.startedAt = 0;
    return this.elapsed;
  }

  reset() {
    this.elapsed = 0;
    this.running = false;
    this.startedAt = 0;
    return this.elapsed;
  }

  tick(now = performance.now()) {
    if (this.running) {
      this.elapsed = now - this.startedAt;
    }

    return this.elapsed;
  }

  getTime() {
    return this.elapsed;
  }
}

window.formatTime = formatTime;
window.Stopwatch = Stopwatch;
