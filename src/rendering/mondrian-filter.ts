import { Filter, defaultFilterVert } from 'pixi.js';
import fragmentSource from './shaders/mondrian.frag?raw';

export function createMondrianFilter(boardTextureSource: object): Filter {
  return Filter.from({
    gl: {
      vertex: defaultFilterVert,
      fragment: fragmentSource,
      name: 'mondrian-basic-filter',
    },
    resources: {
      uBoardTex: boardTextureSource,
    },
  });
}
