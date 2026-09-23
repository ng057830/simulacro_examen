/**
 * Controlador Principal del Simulador de Examen de Oposiciones
 */
class ExamApp {
  constructor() {
    this.exams = EXAM_DATABASE;
    this.selectedExamId = this.exams[0] ? this.exams[0].id : null;
    this.currentExam = null;
    this.currentQIndex = 0;
    this.userAnswers = [];
    this.flagged = [];
    this.scoringMode = 'oposicion'; // 'oposicion' (-0.25) o 'epso' (0)
    this.examMode = 'oficial'; // 'oficial' (estricto) o 'practica' (con pausa)

    this.timer = null;
    this.calculator = null;
    this.notepad = null;

    this.init();
  }

  init() {
    this.calculator = new OfficialCalculator();
    this.notepad = new OfficialNotepad();
    this.initTimer();
    this.bindGlobalEvents();
    this.renderIntroView();
  }

  initTimer() {
    this.timer = new OfficialExamTimer(
      1200, // 20 minutos = 1200 s
      () => this.handleTimeExpired(),
      (remaining) => {}
    );
  }

  bindGlobalEvents() {
    // Teclado en pantalla de examen
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está en el bloc de notas
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const examView = document.getElementById('view-exam');
      if (!examView || examView.classList.contains('hidden')) {
        return;
      }

      // Si el modal de confirmación o solución está abierto, no capturar
      const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
      if (activeModal) return;

      const key = e.key.toUpperCase();

      // Selección de opciones A..E o 1..5
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        e.preventDefault();
        this.selectAnswer(key);
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        e.preventDefault();
        const letter = String.fromCharCode(64 + parseInt(key));
        this.selectAnswer(letter);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.nextQuestion();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prevQuestion();
      } else if (key === 'F' || key === 'M') {
        e.preventDefault();
        this.toggleFlag();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        this.clearAnswer();
      }
    });

    // Delegación de eventos en modales
    const modalConfirm = document.getElementById('modal-confirm-finish');
    if (modalConfirm) {
      document.getElementById('btn-cancel-finish')?.addEventListener('click', () => {
        modalConfirm.classList.add('hidden');
      });
      document.getElementById('btn-confirm-finish')?.addEventListener('click', () => {
        modalConfirm.classList.add('hidden');
        this.finishExam();
      });
    }

    const modalSolution = document.getElementById('modal-solution');
    if (modalSolution) {
      document.getElementById('btn-close-solution')?.addEventListener('click', () => {
        modalSolution.classList.add('hidden');
      });
    }
  }

  // ==========================================
  // VISTA 1: INTRO / SELECCIÓN DE EXAMEN
  // ==========================================
  renderIntroView() {
    this.switchView('view-intro');
    this.timer.reset(1200);

    const cardsContainer = document.getElementById('exam-cards-container');
    if (!cardsContainer) return;
    cardsContainer.innerHTML = '';

    const history = this.getHistory();

    // Opción Especial: Examen Aleatorio Combinado
    const randomCard = document.createElement('div');
    randomCard.className = `exam-card ${this.selectedExamId === 'RANDOM' ? 'selected' : ''}`;
    randomCard.dataset.examId = 'RANDOM';
    randomCard.innerHTML = `
      <div>
        <div class="exam-card-title">🎲 Simulacro Aleatorio Combinado</div>
        <p style="font-size:0.85rem; color:var(--gray-600); margin-top:0.35rem;">
          10 preguntas seleccionadas al azar entre los 18 exámenes para un entrenamiento impredecible.
        </p>
      </div>
      <div class="exam-card-meta">
        <span>⏱️ 20 min</span>
        <span>📝 10 preguntas</span>
        <span>📊 Mezcla aleatoria</span>
      </div>
    `;
    randomCard.addEventListener('click', () => this.selectExamCard('RANDOM'));
    cardsContainer.appendChild(randomCard);

    // 18 Exámenes Oficiales
    this.exams.forEach(exam => {
      const card = document.createElement('div');
      card.className = `exam-card ${this.selectedExamId === exam.id ? 'selected' : ''}`;
      card.dataset.examId = exam.id;

      const lastAttempt = history[exam.id];
      let scoreBadge = '';
      if (lastAttempt) {
        const isApto = lastAttempt.score >= 5.0;
        scoreBadge = `
          <div class="exam-card-score ${isApto ? 'badge-success' : 'badge-danger'}">
            Último: ${lastAttempt.score.toFixed(2)}/10 (${isApto ? 'APTO' : 'NO APTO'})
          </div>
        `;
      }

      card.innerHTML = `
        <div>
          <div class="exam-card-title">${exam.title}</div>
          <p style="font-size:0.8rem; color:var(--gray-500); margin-top:0.25rem;">
            Prueba oficial de Razonamiento Numérico del Instituto Europeo.
          </p>
          ${scoreBadge}
        </div>
        <div class="exam-card-meta">
          <span>⏱️ 20 min</span>
          <span>📝 10 preguntas</span>
          <span>🧮 Calculadora</span>
        </div>
      `;
      card.addEventListener('click', () => this.selectExamCard(exam.id));
      cardsContainer.appendChild(card);
    });

    // Botón de comenzar
    const btnStart = document.getElementById('btn-start-exam');
    if (btnStart) {
      btnStart.onclick = () => this.startSelectedExam();
    }

    // Configuración de baremo
    const selScoring = document.getElementById('select-scoring-mode');
    if (selScoring) {
      selScoring.value = this.scoringMode;
      selScoring.onchange = (e) => {
        this.scoringMode = e.target.value;
      };
    }
  }

  selectExamCard(examId) {
    this.selectedExamId = examId;
    document.querySelectorAll('.exam-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.examId === examId);
    });
  }

  // ==========================================
  // INICIAR EXAMEN
  // ==========================================
  startSelectedExam() {
    if (this.selectedExamId === 'RANDOM') {
      this.currentExam = this.generateRandomExam();
    } else {
      this.currentExam = this.exams.find(e => e.id === this.selectedExamId);
    }

    if (!this.currentExam) return;

    this.currentQIndex = 0;
    this.userAnswers = new Array(10).fill(null);
    this.flagged = new Array(10).fill(false);

    this.switchView('view-exam');
    this.renderQuestionWorkspace();
    this.renderNavMatrix();
    this.timer.reset(1200);
    this.timer.start();

    // Actualizar nombre de examen en barra
    const titleEl = document.getElementById('exam-active-title');
    if (titleEl) {
      titleEl.textContent = this.currentExam.title;
    }
  }

  generateRandomExam() {
    const allQuestions = [];
    this.exams.forEach(exam => {
      exam.questions.forEach(q => {
        allQuestions.push({
          ...q,
          originExam: exam.title
        });
      });
    });

    // Mezclar aleatoriamente
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const selectedQ = allQuestions.slice(0, 10).map((q, idx) => ({
      ...q,
      num: idx + 1
    }));

    return {
      id: 'RANDOM',
      title: 'Simulacro Aleatorio Combinado (10 preguntas)',
      num_questions: 10,
      time_limit_seconds: 1200,
      questions: selectedQ
    };
  }

  // ==========================================
  // VISTA 2: ESPACIO DE TRABAJO DEL EXAMEN
  // ==========================================
  renderQuestionWorkspace() {
    const q = this.currentExam.questions[this.currentQIndex];
    if (!q) return;

    // Número de pregunta
    const numEl = document.getElementById('q-current-num');
    if (numEl) numEl.textContent = `Pregunta ${this.currentQIndex + 1} de 10`;

    // Imagen de alta resolución del enunciado y tabla
    const imgEl = document.getElementById('question-image');
    if (imgEl) {
      imgEl.src = q.image;
      imgEl.alt = `Pregunta ${this.currentQIndex + 1}`;
    }

    // Estado del botón de bandera
    const btnFlag = document.getElementById('btn-flag-question');
    if (btnFlag) {
      btnFlag.classList.toggle('active', !!this.flagged[this.currentQIndex]);
    }

    // Renderizar opciones A, B, C, D, E
    this.renderOptions();

    // Actualizar matriz de botones
    this.updateNavMatrix();

    // Estado de botones Anterior y Siguiente
    const btnPrev = document.getElementById('btn-prev-q');
    const btnNext = document.getElementById('btn-next-q');
    if (btnPrev) btnPrev.disabled = this.currentQIndex === 0;
    if (btnNext) btnNext.disabled = this.currentQIndex === 9;
  }

  renderOptions() {
    const container = document.getElementById('options-list');
    if (!container) return;
    container.innerHTML = '';

    const currentAnswer = this.userAnswers[this.currentQIndex];
    const letters = ['A', 'B', 'C', 'D', 'E'];

    letters.forEach((letter, idx) => {
      const btn = document.createElement('div');
      const isSelected = currentAnswer === letter;
      btn.className = `option-btn ${isSelected ? 'selected' : ''}`;
      btn.innerHTML = `
        <div class="option-letter">${letter}</div>
        <div class="option-label">Opción ${letter}</div>
        <div class="option-shortcut">Tecla [${idx + 1}] o [${letter}]</div>
      `;
      btn.addEventListener('click', () => {
        this.selectAnswer(letter);
      });
      container.appendChild(btn);
    });
  }

  selectAnswer(letter) {
    this.userAnswers[this.currentQIndex] = letter;
    this.renderOptions();
    this.updateNavMatrix();
  }

  clearAnswer() {
    this.userAnswers[this.currentQIndex] = null;
    this.renderOptions();
    this.updateNavMatrix();
  }

  toggleFlag() {
    this.flagged[this.currentQIndex] = !this.flagged[this.currentQIndex];
    const btnFlag = document.getElementById('btn-flag-question');
    if (btnFlag) {
      btnFlag.classList.toggle('active', this.flagged[this.currentQIndex]);
    }
    this.updateNavMatrix();
  }

  nextQuestion() {
    if (this.currentQIndex < 9) {
      this.currentQIndex++;
      this.renderQuestionWorkspace();
    }
  }

  prevQuestion() {
    if (this.currentQIndex > 0) {
      this.currentQIndex--;
      this.renderQuestionWorkspace();
    }
  }

  goToQuestion(idx) {
    if (idx >= 0 && idx < 10) {
      this.currentQIndex = idx;
      this.renderQuestionWorkspace();
    }
  }

  renderNavMatrix() {
    const matrixEl = document.getElementById('question-nav-matrix');
    if (!matrixEl) return;
    matrixEl.innerHTML = '';

    for (let i = 0; i < 10; i++) {
      const btn = document.createElement('button');
      btn.className = 'btn-nav-q';
      btn.textContent = i + 1;
      btn.addEventListener('click', () => this.goToQuestion(i));
      matrixEl.appendChild(btn);
    }
    this.updateNavMatrix();
  }

  updateNavMatrix() {
    const buttons = document.querySelectorAll('.btn-nav-q');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('current', i === this.currentQIndex);
      btn.classList.toggle('answered', this.userAnswers[i] !== null);
      btn.classList.toggle('flagged', !!this.flagged[i]);
    });
  }

  // ==========================================
  // CONFIRMACIÓN Y FINALIZACIÓN
  // ==========================================
  promptFinish() {
    const answeredCount = this.userAnswers.filter(a => a !== null).length;
    const blankCount = 10 - answeredCount;
    const flaggedCount = this.flagged.filter(f => f).length;

    document.getElementById('modal-stat-answered').textContent = answeredCount;
    document.getElementById('modal-stat-blank').textContent = blankCount;
    document.getElementById('modal-stat-flagged').textContent = flaggedCount;

    const modal = document.getElementById('modal-confirm-finish');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  handleTimeExpired() {
    alert('⏱️ ¡Tiempo agotado! El examen se finalizará y corregirá automáticamente.');
    this.finishExam();
  }

  finishExam() {
    this.timer.stop();
    const timeSpentSeconds = this.timer.getTimeSpent();

    // Corrección
    let correctCount = 0;
    let incorrectCount = 0;
    let blankCount = 0;

    const breakdown = [];

    this.currentExam.questions.forEach((q, idx) => {
      const userAns = this.userAnswers[idx];
      const isCorrect = userAns === q.correct;
      const isBlank = userAns === null;

      if (isBlank) {
        blankCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      breakdown.push({
        num: idx + 1,
        userAnswer: userAns,
        correctAnswer: q.correct,
        isCorrect: isCorrect,
        isBlank: isBlank,
        solImages: q.sol_images
      });
    });

    // Puntuación
    let rawScore = 0;
    if (this.scoringMode === 'oposicion') {
      // Oposiciones España: Aciertos (+1), Errores (-0.25), Blancos (0)
      rawScore = Math.max(0, (correctCount * 1.0) - (incorrectCount * 0.25));
    } else {
      // EPSO UE: Aciertos (+1), Sin penalización
      rawScore = correctCount * 1.0;
    }

    const finalScore = parseFloat(rawScore.toFixed(2));
    const isApto = finalScore >= 5.0;

    // Guardar en historial
    this.saveResult(this.currentExam.id, {
      score: finalScore,
      correct: correctCount,
      incorrect: incorrectCount,
      blank: blankCount,
      date: new Date().toISOString(),
      timeSpent: timeSpentSeconds
    });

    this.renderResultsView({
      examTitle: this.currentExam.title,
      finalScore: finalScore,
      isApto: isApto,
      correctCount: correctCount,
      incorrectCount: incorrectCount,
      blankCount: blankCount,
      timeSpentSeconds: timeSpentSeconds,
      breakdown: breakdown
    });
  }

  // ==========================================
  // VISTA 3: RESULTADOS Y EXPLICACIONES
  // ==========================================
  renderResultsView(results) {
    this.switchView('view-results');

    // Score Badge
    const badgeEl = document.getElementById('results-score-badge');
    const numEl = document.getElementById('results-score-num');
    const statusEl = document.getElementById('results-score-status');

    if (badgeEl && numEl && statusEl) {
      badgeEl.className = `score-badge-large ${results.isApto ? 'apto' : 'no-apto'}`;
      numEl.textContent = `${results.finalScore.toFixed(2)}`;
      statusEl.textContent = results.isApto ? 'APTO' : 'NO APTO';
    }

    // Métricas
    document.getElementById('metric-correct').textContent = results.correctCount;
    document.getElementById('metric-incorrect').textContent = results.incorrectCount;
    document.getElementById('metric-blank').textContent = results.blankCount;

    const min = Math.floor(results.timeSpentSeconds / 60);
    const sec = results.timeSpentSeconds % 60;
    document.getElementById('metric-time').textContent = `${min}m ${sec}s`;

    const penaltyNote = document.getElementById('results-scoring-info');
    if (penaltyNote) {
      penaltyNote.textContent = this.scoringMode === 'oposicion'
        ? 'Baremo Oficial de Oposiciones: +1.0 por acierto, -0.25 por error, 0 en blanco.'
        : 'Baremo EPSO Unión Europea: +1.0 por acierto, sin penalización por error.';
    }

    // Lista de desglose pregunta por pregunta
    const listEl = document.getElementById('review-questions-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    results.breakdown.forEach((item) => {
      const itemEl = document.createElement('div');
      const statusClass = item.isBlank ? 'blank' : item.isCorrect ? 'correct' : 'incorrect';
      const statusBadge = item.isBlank
        ? '<span class="badge badge-warning">En blanco</span>'
        : item.isCorrect
        ? '<span class="badge badge-success">Correcta (+1.0)</span>'
        : '<span class="badge badge-danger">Fallada (-0.25)</span>';

      itemEl.className = `review-item ${statusClass}`;
      itemEl.innerHTML = `
        <div class="review-info">
          <div class="review-q-num">Pregunta ${item.num}</div>
          <div class="review-answers-pill">
            <span>Tu respuesta: <strong>${item.userAnswer || '—'}</strong></span>
            <span>Oficial: <strong style="color:var(--success);">${item.correctAnswer}</strong></span>
          </div>
          ${statusBadge}
        </div>
        <button class="btn btn-secondary btn-view-solution" data-q-num="${item.num}">
          📖 Ver Solución Explicada
        </button>
      `;

      itemEl.querySelector('.btn-view-solution')?.addEventListener('click', () => {
        this.openSolutionModal(item);
      });

      listEl.appendChild(itemEl);
    });

    // Botones de acción final
    document.getElementById('btn-retry-exam')?.addEventListener('click', () => {
      this.startSelectedExam();
    });
    document.getElementById('btn-back-menu')?.addEventListener('click', () => {
      this.renderIntroView();
    });
  }

  openSolutionModal(item) {
    const modal = document.getElementById('modal-solution');
    const titleEl = document.getElementById('solution-modal-title');
    const containerEl = document.getElementById('solution-images-container');

    if (!modal || !containerEl) return;

    if (titleEl) {
      titleEl.textContent = `Resolución Explicada Oficial - Pregunta ${item.num}`;
    }

    containerEl.innerHTML = '';

    if (item.solImages && item.solImages.length > 0) {
      item.solImages.forEach((imgSrc) => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'solution-image';
        img.alt = `Explicación Pregunta ${item.num}`;
        containerEl.appendChild(img);
      });
    } else {
      containerEl.innerHTML = '<p style="padding:1rem; color:var(--gray-600);">No se encontró hoja de solución gráfica.</p>';
    }

    modal.classList.remove('hidden');
  }

  // ==========================================
  // UTILIDADES Y PERSISTENCIA
  // ==========================================
  switchView(viewId) {
    ['view-intro', 'view-exam', 'view-results'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== viewId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveResult(examId, data) {
    try {
      const history = this.getHistory();
      history[examId] = data;
      localStorage.setItem('rvne_exam_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  getHistory() {
    try {
      const saved = localStorage.getItem('rvne_exam_history');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }
}

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ExamApp();

  // Conectar botones fijos
  document.getElementById('btn-flag-question')?.addEventListener('click', () => window.app.toggleFlag());
  document.getElementById('btn-clear-question')?.addEventListener('click', () => window.app.clearAnswer());
  document.getElementById('btn-prev-q')?.addEventListener('click', () => window.app.prevQuestion());
  document.getElementById('btn-next-q')?.addEventListener('click', () => window.app.nextQuestion());
  document.getElementById('btn-finish-exam')?.addEventListener('click', () => window.app.promptFinish());
});
