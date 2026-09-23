/**
 * Temporizador Oficial de Examen (20 Minutos)
 */
class OfficialExamTimer {
  constructor(durationSeconds = 1200, onExpireCallback = null, onTickCallback = null) {
    this.totalDuration = durationSeconds;
    this.remainingSeconds = durationSeconds;
    this.timerInterval = null;
    this.isRunning = false;
    this.onExpire = onExpireCallback;
    this.onTick = onTickCallback;

    this.timerContainer = document.getElementById('exam-timer');
    this.timerDisplay = document.getElementById('timer-time');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();

    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.render();
        if (this.onTick) this.onTick(this.remainingSeconds);
      } else {
        this.stop();
        if (this.onExpire) this.onExpire();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  resume() {
    if (!this.isRunning && this.remainingSeconds > 0) {
      this.start();
    }
  }

  stop() {
    this.pause();
  }

  reset(durationSeconds = 1200) {
    this.stop();
    this.totalDuration = durationSeconds;
    this.remainingSeconds = durationSeconds;
    this.render();
  }

  getTimeSpent() {
    return this.totalDuration - this.remainingSeconds;
  }

  render() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (this.timerDisplay) {
      this.timerDisplay.textContent = formatted;
    }

    if (this.timerContainer) {
      if (this.remainingSeconds <= 60) {
        this.timerContainer.className = 'timer-container timer-danger';
      } else if (this.remainingSeconds <= 300) {
        this.timerContainer.className = 'timer-container timer-warning';
      } else {
        this.timerContainer.className = 'timer-container';
      }
    }
  }
}
