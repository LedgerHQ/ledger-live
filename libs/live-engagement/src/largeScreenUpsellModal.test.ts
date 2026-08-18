import {
  initialState,
  isStorableTimestamp,
  largeScreenUpsellModalReducer,
  lastSeenUpsellModalSelector,
  recordUpsellModalDisplay,
  restoreLargeScreenUpsellModalState,
  resetUpsellModalRetries,
  retriesUpsellModalSelector,
  setLastSeenUpsellModal,
  setUpsellModalRetries,
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

  it("restores only non-negative timestamps representable by JS Date", () => {
    const invalidLastSeenAtValues = [2.7, -1, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1];

    for (const lastSeenAt of invalidLastSeenAtValues) {
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
        lastSeenAt: null,
      });
    }
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

  it("resets retries without clearing the last display timestamp", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      largeScreenUpsellModalReducer(
        {
          retries: 3,
          lastSeenAt,
        },
        resetUpsellModalRetries(),
      ),
    ).toEqual({
      retries: 0,
      lastSeenAt,
    });
  });

  it("sets the retry count to an arbitrary non-negative integer", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      largeScreenUpsellModalReducer({ retries: 0, lastSeenAt }, setUpsellModalRetries(5)),
    ).toEqual({
      retries: 5,
      lastSeenAt,
    });
  });

  it("ignores invalid retry counts", () => {
    const state = { retries: 3, lastSeenAt: null };

    for (const invalid of [-1, 2.7, NaN]) {
      expect(largeScreenUpsellModalReducer(state, setUpsellModalRetries(invalid))).toEqual(state);
    }
  });

  it("sets the last display timestamp to an arbitrary value or null", () => {
    const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

    expect(
      largeScreenUpsellModalReducer(
        { retries: 1, lastSeenAt: null },
        setLastSeenUpsellModal(lastSeenAt),
      ),
    ).toEqual({
      retries: 1,
      lastSeenAt,
    });

    expect(
      largeScreenUpsellModalReducer({ retries: 1, lastSeenAt }, setLastSeenUpsellModal(null)),
    ).toEqual({
      retries: 1,
      lastSeenAt: null,
    });
  });

  it("ignores invalid last display timestamps", () => {
    const state = { retries: 1, lastSeenAt: Date.parse("2026-07-01T12:00:00.000Z") };

    for (const invalid of [-1, 2.7, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
      expect(largeScreenUpsellModalReducer(state, setLastSeenUpsellModal(invalid))).toEqual(state);
    }
  });

  it("accepts only non-negative timestamps within the JS Date range", () => {
    const MAX_DATE_MS = 8.64e15;

    expect(isStorableTimestamp(0)).toBe(true);
    expect(isStorableTimestamp(Date.parse("2026-07-01T12:00:00.000Z"))).toBe(true);
    expect(isStorableTimestamp(MAX_DATE_MS)).toBe(true);

    for (const invalid of [
      -1,
      2.7,
      NaN,
      MAX_DATE_MS + 1,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(isStorableTimestamp(invalid)).toBe(false);
    }
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
