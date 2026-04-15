type SvgWorkerRequest = {
  type: 'GENERATE_SVG';
  payload: {
    grid: Uint8Array;
    width: number;
    height: number;
    cellSize: number;
  };
};

type SvgWorkerResponse = {
  type: 'SVG_GENERATED';
  payload: {
    svg: string;
  };
};

let svgWorker: Worker | null = null;

export function exportVectorArt(grid: Uint8Array, width: number, height: number, cellSize: number): Promise<string> {
  const worker = getSvgWorker();
  const gridCopy = new Uint8Array(grid);

  return new Promise<string>((resolve, reject) => {
    const onMessage = (event: MessageEvent<SvgWorkerResponse>): void => {
      if (event.data?.type !== 'SVG_GENERATED') {
        return;
      }
      cleanup();
      resolve(event.data.payload.svg);
    };

    const onError = (error: ErrorEvent): void => {
      cleanup();
      reject(error.error ?? new Error(error.message));
    };

    const cleanup = (): void => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);

    const message: SvgWorkerRequest = {
      type: 'GENERATE_SVG',
      payload: {
        grid: gridCopy,
        width,
        height,
        cellSize,
      },
    };

    worker.postMessage(message, [gridCopy.buffer]);
  });
}

function getSvgWorker(): Worker {
  if (!svgWorker) {
    svgWorker = new Worker(new URL('../worker/svg-export.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return svgWorker;
}
