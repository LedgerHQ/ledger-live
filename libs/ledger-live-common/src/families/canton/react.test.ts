/**
 * @jest-environment jsdom
 */

// Mock the bridge to avoid loading all bridge implementations with ESM dependencies
jest.mock("../../bridge", () => ({
  getCurrencyBridge: jest.fn(),
}));

jest.mock("@ledgerhq/coin-canton/config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: () => ({ nativeInstrumentId: "Amulet" }),
  },
}));

import { renderHook, act } from "@testing-library/react";
import BigNumber from "bignumber.js";
import { getRemainingTime, useTimeRemaining, useWithdrawableBalance } from "./react";

const MILLISECOND = 1000;
const SECOND = 1 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("getRemainingTime", () => {
  test("should return empty string for negative or zero diff", () => {
    expect(getRemainingTime(0)).toBe("");
    expect(getRemainingTime(-1000)).toBe("");
    expect(getRemainingTime(-100000)).toBe("");
  });

  test("should format seconds only", () => {
    expect(getRemainingTime(30 * SECOND)).toBe("30s");
    expect(getRemainingTime(59 * SECOND)).toBe("59s");
    expect(getRemainingTime(1 * SECOND)).toBe("01s");
  });

  test("should format minutes and seconds", () => {
    expect(getRemainingTime(1 * MINUTE + 30 * SECOND)).toBe("01m 30s");
    expect(getRemainingTime(5 * MINUTE + 15 * SECOND)).toBe("05m 15s");
    expect(getRemainingTime(59 * MINUTE + 59 * SECOND)).toBe("59m 59s");
  });

  test("should format hours, minutes and seconds", () => {
    expect(getRemainingTime(1 * HOUR + 30 * MINUTE + 15 * SECOND)).toBe("01h 30m 15s");
    expect(getRemainingTime(2 * HOUR + 5 * MINUTE + 10 * SECOND)).toBe("02h 05m 10s");
    expect(getRemainingTime(23 * HOUR + 59 * MINUTE + 59 * SECOND)).toBe("23h 59m 59s");
  });

  test("should format days, hours, minutes and seconds", () => {
    expect(getRemainingTime(1 * DAY + 2 * HOUR + 30 * MINUTE + 15 * SECOND)).toBe(
      "01d 02h 30m 15s",
    );
    expect(getRemainingTime(5 * DAY + 10 * HOUR + 5 * MINUTE + 10 * SECOND)).toBe(
      "05d 10h 05m 10s",
    );
    expect(getRemainingTime(10 * DAY + 23 * HOUR + 59 * MINUTE + 59 * SECOND)).toBe(
      "10d 23h 59m 59s",
    );
  });

  test("should skip zero values", () => {
    expect(getRemainingTime(1 * DAY)).toBe("01d 00h 00m 00s");
    expect(getRemainingTime(1 * HOUR)).toBe("01h 00m 00s");
    expect(getRemainingTime(1 * MINUTE)).toBe("01m 00s");
    expect(getRemainingTime(1 * DAY + 1 * MINUTE)).toBe("01d 00h 01m 00s");
    expect(getRemainingTime(1 * DAY + 1 * HOUR)).toBe("01d 01h 00m 00s");
  });
});

describe("useTimeRemaining", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  test("should return empty string when proposal is null", () => {
    const { result } = renderHook(() => useTimeRemaining());
    expect(result.current).toBe("");
  });

  test("should return empty string when proposal is expired", () => {
    const proposal = {
      expiresAt: (Date.now() - 1000) * 1000, // 1 second ago
      isExpired: true,
    };
    const { result } = renderHook(() => useTimeRemaining(proposal.expiresAt, proposal.isExpired));
    expect(result.current).toBe("");
  });

  test("should return formatted time remaining for valid proposal", () => {
    const expiresAt = Date.now() + 2 * HOUR + 30 * MINUTE + 15 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));
    expect(result.current).toBe("02h 30m 15s");
  });

  test("should update time remaining every second", () => {
    const expiresAt = Date.now() + 2 * MINUTE + 30 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("02m 30s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("02m 29s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("02m 28s");

    act(() => {
      jest.advanceTimersByTime(30 * SECOND);
    });
    expect(result.current).toBe("01m 58s");
  });

  test("should return empty string when time expires", () => {
    const expiresAt = Date.now() + 2 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("02s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("01s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toBe("");
  });

  test("should clear interval on unmount", () => {
    const expiresAt = Date.now() + 1 * HOUR;
    const { result, unmount } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toBe("01h 00m 00s");

    unmount();

    // Advance time after unmount - should not cause errors
    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
  });
});

describe("useWithdrawableBalance", () => {
  const PARTY = "test-party-id";
  const PAST_MICROS = (Date.now() - 60_000) * 1000;
  const FUTURE_MICROS = (Date.now() + 60_000) * 1000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeParent = (proposals: any[]) =>
    ({
      type: "Account",
      xpub: PARTY,
      currency: { id: "canton", units: [{ code: "CC", magnitude: 10, name: "Amulet" }] },
      cantonResources: { pendingTransferProposals: proposals },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  test("returns 0 when account has no canton resources", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = { type: "Account", xpub: PARTY } as any;
    const { result } = renderHook(() => useWithdrawableBalance(account, []));
    expect(result.current.toString()).toBe("0");
  });

  test("sums only outgoing AND expired native proposals on a parent account", () => {
    const parent = makeParent([
      {
        sender: PARTY,
        amount: "1000",
        expires_at_micros: PAST_MICROS,
        instrument_id: "Amulet",
      },
      // outgoing but not expired → skip
      {
        sender: PARTY,
        amount: "2000",
        expires_at_micros: FUTURE_MICROS,
        instrument_id: "Amulet",
      },
      // incoming, expired → skip
      {
        sender: "someone-else",
        amount: "4000",
        expires_at_micros: PAST_MICROS,
        instrument_id: "Amulet",
      },
    ]);
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("1000"));
  });

  test("excludes token proposals from the parent-account sum (would mis-render as native unit)", () => {
    const parent = makeParent([
      {
        sender: PARTY,
        amount: "500",
        expires_at_micros: PAST_MICROS,
        instrument_id: "Amulet",
      },
      {
        sender: PARTY,
        amount: "99999999",
        expires_at_micros: PAST_MICROS,
        instrument_id: "cbtc-instrument-id",
      },
    ]);
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("500"));
  });

  test("token sub-account sums its own (already-filtered) proposals", () => {
    const subAccount = {
      type: "TokenAccount",
      parentId: "parent-id",
      cantonResources: {
        pendingTransferProposals: [
          {
            sender: PARTY,
            amount: "123",
            expires_at_micros: PAST_MICROS,
            instrument_id: "cbtc-instrument-id",
          },
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const parent = {
      type: "Account",
      id: "parent-id",
      xpub: PARTY,
      currency: { id: "canton", units: [{ code: "CC", magnitude: 10, name: "Amulet" }] },
      subAccounts: [subAccount],
      cantonResources: { pendingTransferProposals: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const { result } = renderHook(() => useWithdrawableBalance(subAccount, [parent]));
    expect(result.current).toEqual(new BigNumber("123"));
  });
});
