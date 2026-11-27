import { nextVersionTapState, VERSION_TAPS_TO_UNLOCK } from "./versionTaps";

function tapTimes(times: number) {
  let state = { count: 0, unlocked: false };
  const unlocks: boolean[] = [];
  for (let i = 0; i < times; i++) {
    state = nextVersionTapState(state.count);
    unlocks.push(state.unlocked);
  }
  return unlocks;
}

describe("nextVersionTapState", () => {
  it("unlocks on the tap that reaches the threshold, and only there", () => {
    expect(VERSION_TAPS_TO_UNLOCK).toBe(5);
    expect(tapTimes(5)).toEqual([false, false, false, false, true]);
  });

  it("does not unlock again on the taps after the threshold", () => {
    expect(tapTimes(7)).toEqual([false, false, false, false, true, false, false]);
  });
});
