export type RngState = {
  seed: number;
};

export type RngNext<T> = {
  value: T;
  rngState: RngState;
};

const UINT32_MAX_PLUS_ONE = 0x1_0000_0000;

export function createRng(seed: number): RngState {
  return {
    seed: seed >>> 0,
  };
}

export function nextUint32(rngState: RngState): RngNext<number> {
  const seed = (rngState.seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = (t ^ (t >>> 14)) >>> 0;

  return {
    value,
    rngState: { seed },
  };
}

export function nextFloat(rngState: RngState): RngNext<number> {
  const { value, rngState: nextState } = nextUint32(rngState);
  return {
    value: value / UINT32_MAX_PLUS_ONE,
    rngState: nextState,
  };
}

export function nextInt(rngState: RngState, maxExclusive: number): RngNext<number> {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const { value: randomFloat, rngState: nextState } = nextFloat(rngState);
  return {
    value: Math.floor(randomFloat * maxExclusive),
    rngState: nextState,
  };
}
