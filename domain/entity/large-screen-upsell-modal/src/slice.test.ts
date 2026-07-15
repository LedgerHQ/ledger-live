import {
  initialState,
  largeScreenUpsellModalSlice,
  lastSeenUpsellModalSelector,
  recordUpsellModalDisplay,
  restoreLargeScreenUpsellModalState,
  resetUpsellModalRetries,
  retriesUpsellModalSelector,
} from "./slice";
import type { LargeScreenUpsellModalState } from "./types";

const reducer = largeScreenUpsellModalSlice.reducer;
const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

describe("largeScreenUpsellModal", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with no retries and no last display timestamp", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  describe("restoreLargeScreenUpsellModalState", () => {
    it.each<{
      description: string;
      payload: Partial<LargeScreenUpsellModalState>;
      expected: LargeScreenUpsellModalState;
    }>([
      {
        description: "a valid persisted state",
        payload: { retries: 2, lastSeenAt },
        expected: { retries: 2, lastSeenAt },
      },
      {
        description: "a missing lastSeenAt",
        payload: { retries: 2 },
        expected: { retries: 2, lastSeenAt: null },
      },
      {
        description: "a non-integer retries count",
        payload: { retries: 2.7, lastSeenAt },
        expected: { retries: 0, lastSeenAt },
      },
      {
        description: "a negative retries count",
        payload: { retries: -1, lastSeenAt },
        expected: { retries: 0, lastSeenAt },
      },
      {
        description: "an unsafe integer retries count",
        payload: { retries: Number.MAX_SAFE_INTEGER + 1, lastSeenAt },
        expected: { retries: 0, lastSeenAt },
      },
      {
        description: "a non-integer lastSeenAt",
        payload: { retries: 2, lastSeenAt: 2.7 },
        expected: { retries: 2, lastSeenAt: null },
      },
      {
        description: "a negative lastSeenAt",
        payload: { retries: 2, lastSeenAt: -1 },
        expected: { retries: 2, lastSeenAt: null },
      },
      {
        description: "an unsafe integer lastSeenAt",
        payload: { retries: 2, lastSeenAt: Number.MAX_SAFE_INTEGER + 1 },
        expected: { retries: 2, lastSeenAt: null },
      },
      {
        description: "an entirely malformed payload",
        payload: { retries: NaN, lastSeenAt: NaN },
        expected: initialState,
      },
    ])("falls back to defaults given $description", ({ payload, expected }) => {
      expect(reducer(undefined, restoreLargeScreenUpsellModalState(payload))).toEqual(expected);
    });
  });

  it("increments retries and refreshes the last display timestamp", () => {
    const firstDisplayTimestamp = lastSeenAt;
    const secondDisplayTimestamp = Date.parse("2026-07-02T12:00:00.000Z");

    const firstDisplayState = reducer(
      initialState,
      recordUpsellModalDisplay(firstDisplayTimestamp),
    );
    expect(firstDisplayState).toEqual({ retries: 1, lastSeenAt: firstDisplayTimestamp });

    expect(reducer(firstDisplayState, recordUpsellModalDisplay(secondDisplayTimestamp))).toEqual({
      retries: 2,
      lastSeenAt: secondDisplayTimestamp,
    });
  });

  it("defaults the display timestamp to now", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-01T12:00:00.000Z"));

    expect(reducer(initialState, recordUpsellModalDisplay())).toEqual({
      retries: 1,
      lastSeenAt,
    });
  });

  it("resets retries without clearing the last display timestamp", () => {
    expect(reducer({ retries: 3, lastSeenAt }, resetUpsellModalRetries())).toEqual({
      retries: 0,
      lastSeenAt,
    });
  });

  it("selects raw values from root state", () => {
    const state = { largeScreenUpsellModal: { retries: 3, lastSeenAt } };

    expect(retriesUpsellModalSelector(state)).toBe(3);
    expect(lastSeenUpsellModalSelector(state)).toBe(lastSeenAt);
  });
});
