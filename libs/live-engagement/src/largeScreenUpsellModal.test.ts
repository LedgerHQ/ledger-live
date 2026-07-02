import {
  initialState,
  largeScreenUpsellModalReducer,
  lastSeenUpsellModalSelector,
  recordUpsellModalDisplay,
  restoreLargeScreenUpsellModalState,
  retriesUpsellModalSelector,
  type LargeScreenUpsellModalState,
} from "./largeScreenUpsellModal";

describe("largeScreenUpsellModal", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with no retries and no last display timestamp", () => {
    expect(largeScreenUpsellModalReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("imports persisted state over defaults", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      largeScreenUpsellModalReducer(
        undefined,
        restoreLargeScreenUpsellModalState({
          retries: 2,
          lastSeenAt,
        }),
      ),
    ).toEqual({
      retries: 2,
      lastSeenAt,
    });
  });

  it("keeps defaults for missing persisted values", () => {
    expect(
      largeScreenUpsellModalReducer(
        undefined,
        restoreLargeScreenUpsellModalState({
          retries: 2,
        }),
      ),
    ).toEqual({
      retries: 2,
      lastSeenAt: null,
    });
  });

  it("restores only non-negative integer retries", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      largeScreenUpsellModalReducer(
        undefined,
        restoreLargeScreenUpsellModalState({
          retries: 2.7,
          lastSeenAt,
        }),
      ),
    ).toEqual({
      retries: 0,
      lastSeenAt,
    });

    expect(
      largeScreenUpsellModalReducer(
        undefined,
        restoreLargeScreenUpsellModalState({
          retries: -1,
          lastSeenAt,
        }),
      ),
    ).toEqual({
      retries: 0,
      lastSeenAt,
    });
  });

  it("falls back to defaults for malformed persisted values", () => {
    const malformedPayload = {
      retries: NaN,
      lastSeenAt: "not-a-timestamp",
    } as unknown as Partial<LargeScreenUpsellModalState>;

    expect(
      largeScreenUpsellModalReducer(
        undefined,
        restoreLargeScreenUpsellModalState(malformedPayload),
      ),
    ).toEqual(initialState);
  });

  it("increments retries and refreshes the last display timestamp", () => {
    const firstDisplayTimestamp = Date.parse("2026-07-01T12:00:00.000Z");
    const secondDisplayTimestamp = Date.parse("2026-07-02T12:00:00.000Z");

    const firstDisplayState = largeScreenUpsellModalReducer(
      initialState,
      recordUpsellModalDisplay(firstDisplayTimestamp),
    );
    expect(firstDisplayState).toEqual({
      retries: 1,
      lastSeenAt: firstDisplayTimestamp,
    });

    expect(
      largeScreenUpsellModalReducer(
        firstDisplayState,
        recordUpsellModalDisplay(secondDisplayTimestamp),
      ),
    ).toEqual({
      retries: 2,
      lastSeenAt: secondDisplayTimestamp,
    });
  });

  it("defaults the display timestamp to now", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-01T12:00:00.000Z"));

    expect(largeScreenUpsellModalReducer(initialState, recordUpsellModalDisplay())).toEqual({
      retries: 1,
      lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z"),
    });
  });

  it("selects raw values", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");
    const state = {
      largeScreenUpsellModal: {
        retries: 3,
        lastSeenAt,
      },
    };

    expect(retriesUpsellModalSelector(state)).toBe(3);
    expect(lastSeenUpsellModalSelector(state)).toBe(lastSeenAt);
  });
});
