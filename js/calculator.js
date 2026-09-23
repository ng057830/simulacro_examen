/**
 * Calculadora Básica Oficial para Exámenes de Oposiciones / EPSO
 */
class OfficialCalculator {
  constructor() {
    this.currentInput = '0';
    this.previousInput = null;
    this.operation = null;
    this.waitingForOperand = false;
    this.memory = 0;
    this.historyExpression = '';
    
    this.initDOM();
    this.bindEvents();
    this.initDraggable();
  }

  initDOM() {
    this.windowEl = document.getElementById('calculator-window');
    this.toggleBtn = document.getElementById('btn-toggle-calculator');
    this.closeBtn = document.getElementById('btn-close-calc');
    this.currentEl = document.getElementById('calc-current');
    this.historyEl = document.getElementById('calc-history');
    this.memIndicatorEl = document.getElementById('calc-mem-indicator');
  }

  bindEvents() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    // Keypad clicks
    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const val = e.target.dataset.val;
        this.handleButton(action, val);
      });
    });

    // Keyboard listener
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in notepad textarea
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      // Toggle calculator with shortcut Alt+C or 'c' when not answering options
      if ((e.key === 'c' || e.key === 'C') && e.altKey) {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (this.isOpen()) {
        if (/^[0-9]$/.test(e.key)) {
          this.inputDigit(e.key);
        } else if (e.key === '.' || e.key === ',') {
          this.inputDecimal();
        } else if (e.key === '+') {
          this.performOperation('+');
        } else if (e.key === '-') {
          this.performOperation('-');
        } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
          this.performOperation('*');
        } else if (e.key === '/') {
          e.preventDefault();
          this.performOperation('/');
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault();
          this.calculate();
        } else if (e.key === 'Backspace') {
          this.backspace();
        } else if (e.key === 'Escape') {
          this.clearAll();
        }
      }
    });
  }

  handleButton(action, val) {
    switch (action) {
      case 'num':
        this.inputDigit(val);
        break;
      case 'decimal':
        this.inputDecimal();
        break;
      case 'op':
        this.performOperation(val);
        break;
      case 'equals':
        this.calculate();
        break;
      case 'clear':
        this.clearAll();
        break;
      case 'clear-entry':
        this.clearEntry();
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'sqrt':
        this.sqrt();
        break;
      case 'percent':
        this.percent();
        break;
      case 'sign':
        this.toggleSign();
        break;
      case 'mem-add':
        this.memoryAdd();
        break;
      case 'mem-sub':
        this.memorySub();
        break;
      case 'mem-recall':
        this.memoryRecall();
        break;
      case 'mem-clear':
        this.memoryClear();
        break;
    }
    this.updateDisplay();
  }

  inputDigit(digit) {
    if (this.waitingForOperand) {
      this.currentInput = digit;
      this.waitingForOperand = false;
    } else {
      this.currentInput = this.currentInput === '0' ? digit : this.currentInput + digit;
    }
    if (this.currentInput.length > 12) {
      this.currentInput = this.currentInput.slice(0, 12);
    }
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.waitingForOperand) {
      this.currentInput = '0.';
      this.waitingForOperand = false;
      this.updateDisplay();
      return;
    }
    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
      this.updateDisplay();
    }
  }

  clearAll() {
    this.currentInput = '0';
    this.previousInput = null;
    this.operation = null;
    this.waitingForOperand = false;
    this.historyExpression = '';
    this.updateDisplay();
  }

  clearEntry() {
    this.currentInput = '0';
    this.updateDisplay();
  }

  backspace() {
    if (this.waitingForOperand) return;
    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
    } else {
      this.currentInput = '0';
    }
    this.updateDisplay();
  }

  toggleSign() {
    const val = parseFloat(this.currentInput);
    if (val !== 0) {
      this.currentInput = String(-val);
      this.updateDisplay();
    }
  }

  sqrt() {
    const val = parseFloat(this.currentInput);
    if (val < 0) {
      this.currentInput = 'Error';
    } else {
      this.currentInput = String(this.formatFloat(Math.sqrt(val)));
      this.historyExpression = `√(${val})`;
    }
    this.waitingForOperand = true;
    this.updateDisplay();
  }

  percent() {
    const val = parseFloat(this.currentInput);
    if (this.previousInput != null && this.operation) {
      // Porcentaje relativo al previousInput
      const p = (this.previousInput * val) / 100;
      this.currentInput = String(this.formatFloat(p));
    } else {
      this.currentInput = String(this.formatFloat(val / 100));
    }
    this.updateDisplay();
  }

  performOperation(nextOp) {
    const inputValue = parseFloat(this.currentInput);

    if (this.previousInput == null) {
      this.previousInput = inputValue;
    } else if (this.operation && !this.waitingForOperand) {
      const currentVal = parseFloat(this.currentInput);
      const result = this.compute(this.previousInput, currentVal, this.operation);
      this.currentInput = String(result);
      this.previousInput = result;
    }

    this.waitingForOperand = true;
    this.operation = nextOp;
    const opSymbol = nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp;
    this.historyExpression = `${this.previousInput} ${opSymbol}`;
    this.updateDisplay();
  }

  calculate() {
    if (this.operation == null || this.previousInput == null) return;

    const currentVal = parseFloat(this.currentInput);
    const opSymbol = this.operation === '*' ? '×' : this.operation === '/' ? '÷' : this.operation;
    this.historyExpression = `${this.previousInput} ${opSymbol} ${currentVal} =`;

    const result = this.compute(this.previousInput, currentVal, this.operation);
    this.currentInput = String(result);
    this.previousInput = null;
    this.operation = null;
    this.waitingForOperand = true;
    this.updateDisplay();
  }

  compute(a, b, op) {
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '*': res = a * b; break;
      case '/': 
        if (b === 0) return 'Error';
        res = a / b; 
        break;
      default: return b;
    }
    return this.formatFloat(res);
  }

  formatFloat(num) {
    if (isNaN(num)) return 'Error';
    // Limitar precisión para evitar artefactos de IEEE 754
    return parseFloat(num.toFixed(8));
  }

  // Memory functions
  memoryAdd() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.memory += val;
      this.updateMemoryIndicator();
    }
  }

  memorySub() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.memory -= val;
      this.updateMemoryIndicator();
    }
  }

  memoryRecall() {
    this.currentInput = String(this.memory);
    this.waitingForOperand = true;
    this.updateDisplay();
  }

  memoryClear() {
    this.memory = 0;
    this.updateMemoryIndicator();
  }

  updateMemoryIndicator() {
    if (this.memory !== 0) {
      this.memIndicatorEl.classList.add('active');
    } else {
      this.memIndicatorEl.classList.remove('active');
    }
  }

  updateDisplay() {
    this.currentEl.textContent = this.currentInput;
    this.historyEl.textContent = this.historyExpression;
  }

  // Window visibility
  isOpen() {
    return this.windowEl && !this.windowEl.classList.contains('hidden');
  }

  show() {
    if (this.windowEl) {
      this.windowEl.classList.remove('hidden');
      if (this.toggleBtn) this.toggleBtn.classList.add('active');
    }
  }

  hide() {
    if (this.windowEl) {
      this.windowEl.classList.add('hidden');
      if (this.toggleBtn) this.toggleBtn.classList.remove('active');
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Draggable logic
  initDraggable() {
    const header = this.windowEl.querySelector('.window-header');
    if (!header) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.windowEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        // Mantener dentro de pantalla
        newLeft = Math.max(10, Math.min(window.innerWidth - this.windowEl.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - this.windowEl.offsetHeight - 10, newTop));

        this.windowEl.style.left = `${newLeft}px`;
        this.windowEl.style.top = `${newTop}px`;
        this.windowEl.style.right = 'auto';
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
}
