import {
  initialState,
  isStorableTimestamp,
  largeScreenUpsellModalSlice,
  lastSeenUpsellModalSelector,
  markBlockedByCompeting,
  markDismissed,
  persistedLargeScreenUpsellModalSelector,
  recordUpsellModalDisplay,
  restoreLargeScreenUpsellModalState,
  resetUpsellModalRetries,
  retriesUpsellModalSelector,
  sessionSelector,
  setLastSeenUpsellModal,
  setUpsellModalRetries,
} from "./slice";
import type { LargeScreenUpsellModalState } from "./types";

const reducer = largeScreenUpsellModalSlice.reducer;
const lastSeenAt = Date.parse("2026-07-01T12:00:00.000Z");

const withSession = (
  state: Pick<LargeScreenUpsellModalState, "retries" | "lastSeenAt">,
  session: LargeScreenUpsellModalState["session"] = "ready",
): LargeScreenUpsellModalState => ({
  ...state,
  session,
});

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
        expected: withSession({ retries: 2, lastSeenAt }),
      },
      {
        description: "a missing lastSeenAt",
        payload: { retries: 2 },
        expected: withSession({ retries: 2, lastSeenAt: null }),
      },
      {
        description: "a non-integer retries count",
        payload: { retries: 2.7, lastSeenAt },
        expected: withSession({ retries: 0, lastSeenAt }),
      },
      {
        description: "a negative retries count",
        payload: { retries: -1, lastSeenAt },
        expected: withSession({ retries: 0, lastSeenAt }),
      },
      {
        description: "an unsafe integer retries count",
        payload: { retries: Number.MAX_SAFE_INTEGER + 1, lastSeenAt },
        expected: withSession({ retries: 0, lastSeenAt }),
      },
      {
        description: "a non-integer lastSeenAt",
        payload: { retries: 2, lastSeenAt: 2.7 },
        expected: withSession({ retries: 2, lastSeenAt: null }),
      },
      {
        description: "a negative lastSeenAt",
        payload: { retries: 2, lastSeenAt: -1 },
        expected: withSession({ retries: 2, lastSeenAt: null }),
      },
      {
        description: "a lastSeenAt above the JS Date range",
        payload: { retries: 2, lastSeenAt: Number.MAX_SAFE_INTEGER },
        expected: withSession({ retries: 2, lastSeenAt: null }),
      },
      {
        description: "an unsafe integer lastSeenAt",
        payload: { retries: 2, lastSeenAt: Number.MAX_SAFE_INTEGER + 1 },
        expected: withSession({ retries: 2, lastSeenAt: null }),
      },
      {
        description: "an entirely malformed payload",
        payload: { retries: NaN, lastSeenAt: NaN },
        expected: initialState,
      },
    ])("falls back to defaults given $description", ({ payload, expected }) => {
      expect(reducer(undefined, restoreLargeScreenUpsellModalState(payload))).toEqual(expected);
    });

    it("does not restore ephemeral session from a persisted payload", () => {
      expect(
        reducer(
          undefined,
          restoreLargeScreenUpsellModalState({
            retries: 2,
            lastSeenAt,
            session: "dismissed",
          }),
        ),
      ).toEqual(withSession({ retries: 2, lastSeenAt }));
    });
  });

  it("increments retries and refreshes the last display timestamp without changing session", () => {
    const firstDisplayTimestamp = lastSeenAt;
    const secondDisplayTimestamp = Date.parse("2026-07-02T12:00:00.000Z");

    const firstDisplayState = reducer(
      initialState,
      recordUpsellModalDisplay(firstDisplayTimestamp),
    );
    expect(firstDisplayState).toEqual(
      withSession({ retries: 1, lastSeenAt: firstDisplayTimestamp }),
    );

    expect(reducer(firstDisplayState, recordUpsellModalDisplay(secondDisplayTimestamp))).toEqual(
      withSession({ retries: 2, lastSeenAt: secondDisplayTimestamp }),
    );
  });

  it("defaults the display timestamp to now", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-01T12:00:00.000Z"));

    expect(reducer(initialState, recordUpsellModalDisplay())).toEqual(
      withSession({ retries: 1, lastSeenAt }),
    );
  });

  it("marks session as dismissed", () => {
    expect(reducer(initialState, markDismissed())).toEqual(
      withSession({ retries: 0, lastSeenAt: null }, "dismissed"),
    );
  });

  it("marks session as blockedByCompeting only while ready", () => {
    expect(reducer(initialState, markBlockedByCompeting())).toEqual(
      withSession({ retries: 0, lastSeenAt: null }, "blockedByCompeting"),
    );

    expect(
      reducer(withSession({ retries: 0, lastSeenAt: null }, "dismissed"), markBlockedByCompeting()),
    ).toEqual(withSession({ retries: 0, lastSeenAt: null }, "dismissed"));
  });

  it("resets retries without clearing the last display timestamp or session", () => {
    expect(
      reducer(withSession({ retries: 3, lastSeenAt }, "dismissed"), resetUpsellModalRetries()),
    ).toEqual(withSession({ retries: 0, lastSeenAt }, "dismissed"));
  });

  it("sets the retry count to an arbitrary non-negative integer", () => {
    expect(reducer(withSession({ retries: 0, lastSeenAt }), setUpsellModalRetries(5))).toEqual(
      withSession({ retries: 5, lastSeenAt }),
    );
  });

  it("ignores invalid retry counts", () => {
    const state = withSession({ retries: 3, lastSeenAt: null });

    for (const invalid of [-1, 2.7, NaN]) {
      expect(reducer(state, setUpsellModalRetries(invalid))).toEqual(state);
    }
  });

  it("sets the last display timestamp to an arbitrary value or null", () => {
    expect(
      reducer(withSession({ retries: 1, lastSeenAt: null }), setLastSeenUpsellModal(lastSeenAt)),
    ).toEqual(withSession({ retries: 1, lastSeenAt }));

    expect(reducer(withSession({ retries: 1, lastSeenAt }), setLastSeenUpsellModal(null))).toEqual(
      withSession({ retries: 1, lastSeenAt: null }),
    );
  });

  it("ignores invalid last display timestamps", () => {
    const state = withSession({ retries: 1, lastSeenAt });

    for (const invalid of [-1, 2.7, NaN, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
      expect(reducer(state, setLastSeenUpsellModal(invalid))).toEqual(state);
    }
  });

  it("accepts only non-negative timestamps within the JS Date range", () => {
    const MAX_DATE_MS = 8.64e15;

    expect(isStorableTimestamp(0)).toBe(true);
    expect(isStorableTimestamp(lastSeenAt)).toBe(true);
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

  it("selects raw values from root state", () => {
    const state = {
      largeScreenUpsellModal: withSession({ retries: 3, lastSeenAt }, "dismissed"),
    };

    expect(retriesUpsellModalSelector(state)).toBe(3);
    expect(lastSeenUpsellModalSelector(state)).toBe(lastSeenAt);
    expect(sessionSelector(state)).toBe("dismissed");
    expect(persistedLargeScreenUpsellModalSelector(state)).toEqual({
      retries: 3,
      lastSeenAt,
    });
  });
});
