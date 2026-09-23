/**
 * Bloc de Notas / Borrador Digital Oficial
 */
class OfficialNotepad {
  constructor() {
    this.storageKey = 'rvne_exam_notepad_draft';
    this.initDOM();
    this.bindEvents();
    this.initDraggable();
    this.loadContent();
  }

  initDOM() {
    this.windowEl = document.getElementById('notepad-window');
    this.toggleBtn = document.getElementById('btn-toggle-notepad');
    this.closeBtn = document.getElementById('btn-close-notepad');
    this.textarea = document.getElementById('notepad-text');
    this.clearBtn = document.getElementById('btn-clear-notepad');
    this.copyBtn = document.getElementById('btn-copy-notepad');
    this.statusEl = document.getElementById('notepad-status');
  }

  bindEvents() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }
    if (this.textarea) {
      this.textarea.addEventListener('input', () => {
        this.saveContent();
        this.updateCharCount();
      });
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        if (this.textarea.value.trim() && confirm('¿Deseas vaciar el borrador de notas?')) {
          this.textarea.value = '';
          this.saveContent();
          this.updateCharCount();
        }
      });
    }
    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        if (this.textarea.value) {
          navigator.clipboard.writeText(this.textarea.value).then(() => {
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '¡Copiado!';
            setTimeout(() => { this.copyBtn.textContent = originalText; }, 1500);
          });
        }
      });
    }

    // Toggle with Alt+N
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'n' || e.key === 'N') && e.altKey) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  saveContent() {
    try {
      localStorage.setItem(this.storageKey, this.textarea.value);
      if (this.statusEl) {
        this.statusEl.textContent = 'Guardado';
        setTimeout(() => {
          this.updateCharCount();
        }, 1000);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  loadContent() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && this.textarea) {
        this.textarea.value = saved;
        this.updateCharCount();
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  updateCharCount() {
    if (this.statusEl && this.textarea) {
      const chars = this.textarea.value.length;
      this.statusEl.textContent = `${chars} caracteres`;
    }
  }

  isOpen() {
    return this.windowEl && !this.windowEl.classList.contains('hidden');
  }

  show() {
    if (this.windowEl) {
      this.windowEl.classList.remove('hidden');
      if (this.toggleBtn) this.toggleBtn.classList.add('active');
      if (this.textarea) this.textarea.focus();
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
