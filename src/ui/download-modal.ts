type DownloadModalOptions = {
  onDownloadImage: () => void | Promise<void>;
  onDownloadVector: () => void | Promise<void>;
};

export type DownloadModal = {
  open: () => void;
  close: () => void;
  destroy: () => void;
};

export function createDownloadModal(host: HTMLElement, options: DownloadModalOptions): DownloadModal {
  const overlay = document.createElement('div');
  overlay.className = 'download-modal-overlay';
  overlay.setAttribute('role', 'presentation');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.tabIndex = -1;

  const dialog = document.createElement('div');
  dialog.className = 'download-modal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'download-modal-title');

  dialog.innerHTML = `
    <div class="download-modal-header">
      <h2 class="download-modal-title" id="download-modal-title">Download artwork</h2>
      <button type="button" class="download-modal-close" data-download-modal-close aria-label="Close">×</button>
    </div>
    <div class="download-modal-body">
      <button type="button" class="download-modal-option" data-download-image>
        <span class="download-modal-option-icon" aria-hidden="true">
          <svg class="download-modal-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
            <circle cx="9" cy="10" r="2" />
            <path d="M4 17.5l4.5-4.5 3.5 3.5 3.5-3.5L20 17.5" />
          </svg>
        </span>
        <span class="download-modal-option-text">
          <span class="download-modal-option-label">Download Image</span>
          <span class="download-modal-option-hint">High-quality JPEG (4K)</span>
        </span>
      </button>
      <button type="button" class="download-modal-option" data-download-vector>
        <span class="download-modal-option-icon" aria-hidden="true">
          <svg class="download-modal-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 17V7l3 3 4-4 4 4 5-5v12H4z" />
            <path d="M7 12h3M14 10h3M10 15h5" />
          </svg>
        </span>
        <span class="download-modal-option-text">
          <span class="download-modal-option-label">Download Vector</span>
          <span class="download-modal-option-hint">SVG for scaling and print</span>
        </span>
      </button>
    </div>
  `;

  overlay.appendChild(dialog);
  host.appendChild(overlay);

  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-download-modal-close]');
  const imageButton = dialog.querySelector<HTMLButtonElement>('[data-download-image]');
  const vectorButton = dialog.querySelector<HTMLButtonElement>('[data-download-vector]');

  let previouslyFocused: HTMLElement | null = null;

  const close = (): void => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    previouslyFocused?.focus();
    previouslyFocused = null;
  };

  const open = (): void => {
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    (imageButton ?? closeButton)?.focus();
  };

  const onOverlayPointerDown = (event: MouseEvent): void => {
    if (event.target === overlay) {
      close();
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!overlay.classList.contains('is-open')) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const runAndClose = async (fn: () => void | Promise<void>): Promise<void> => {
    try {
      await fn();
    } finally {
      close();
    }
  };

  overlay.addEventListener('mousedown', onOverlayPointerDown);
  window.addEventListener('keydown', onKeyDown);

  closeButton?.addEventListener('click', () => {
    close();
  });

  imageButton?.addEventListener('click', () => {
    void runAndClose(options.onDownloadImage);
  });

  vectorButton?.addEventListener('click', () => {
    void runAndClose(options.onDownloadVector);
  });

  const destroy = (): void => {
    overlay.removeEventListener('mousedown', onOverlayPointerDown);
    window.removeEventListener('keydown', onKeyDown);
    overlay.remove();
  };

  return { open, close, destroy };
}
