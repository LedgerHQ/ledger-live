// @flow

export const delay = (ms: number): Promise<void> =>
  new Promise(f => setTimeout(f, ms));
