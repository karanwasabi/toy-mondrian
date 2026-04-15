import type { InputCommand } from '../engine/types';

type Dispatch = (cmd: InputCommand) => void;
type CanDispatch = () => boolean;

export function setupKeyboard(dispatch: Dispatch, canDispatch: CanDispatch = () => true): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    let command: InputCommand | null = null;

    switch (event.code) {
      case 'ArrowLeft':
        command = { type: 'MoveLeft' };
        break;
      case 'ArrowRight':
        command = { type: 'MoveRight' };
        break;
      case 'ArrowUp':
        command = { type: 'RotateCW' };
        break;
      case 'ArrowDown':
        command = { type: 'SoftDropStart' };
        break;
      case 'Space':
        command = { type: 'HardDrop' };
        break;
      default:
        break;
    }

    if (!command) {
      return;
    }

    event.preventDefault();
    if (!canDispatch()) {
      return;
    }
    dispatch(command);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.code !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    if (!canDispatch()) {
      return;
    }
    dispatch({ type: 'SoftDropStop' });
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  };
}
