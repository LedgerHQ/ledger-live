/**
 * @jest-environment jsdom
 */

// Mock the bridge to avoid loading all bridge implementations with ESM dependencies
jest.mock("../../bridge", () => ({
  getCurrencyBridge: jest.fn(),
}));

jest.mock("../../config", () => ({
  getCurrencyConfiguration: () => ({ nativeInstrumentId: "Amulet" }),
}));

jest.mock("@ledgerhq/coin-canton/network/gateway", () => ({
  ...jest.requireActual("@ledgerhq/coin-canton/network/gateway"),
  getCalTokensCached: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn(),
}));

import { renderHook, act, waitFor } from "@testing-library/react";
import { getCalTokensCached } from "@ledgerhq/coin-canton/network/gateway";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import { instrumentKey } from "./proposalSorting";
import {
  getRemainingTime,
  useCantonOfferTokens,
  useTimeRemaining,
  useWithdrawableBalance,
} from "./react";

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

  test("should report expired with no countdown when proposal is null", () => {
    const { result } = renderHook(() => useTimeRemaining());
    expect(result.current).toEqual({ timeRemaining: "", isExpired: true });
  });

  test("should report expired with no countdown when proposal is expired", () => {
    const proposal = {
      expiresAt: (Date.now() - 1000) * 1000, // 1 second ago
      isExpired: true,
    };
    const { result } = renderHook(() => useTimeRemaining(proposal.expiresAt, proposal.isExpired));
    expect(result.current).toEqual({ timeRemaining: "", isExpired: true });
  });

  test("should report expired when the deadline passed but the caller flag is stale", () => {
    const expiresAt = Date.now() - 1 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000, false));
    expect(result.current).toEqual({ timeRemaining: "", isExpired: true });
  });

  test("should return formatted time remaining for valid proposal on first render", () => {
    const expiresAt = Date.now() + 2 * HOUR + 30 * MINUTE + 15 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));
    expect(result.current).toEqual({ timeRemaining: "02h 30m 15s", isExpired: false });
  });

  test("should update time remaining every second", () => {
    const expiresAt = Date.now() + 2 * MINUTE + 30 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current.timeRemaining).toBe("02m 30s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current.timeRemaining).toBe("02m 29s");

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current.timeRemaining).toBe("02m 28s");

    act(() => {
      jest.advanceTimersByTime(30 * SECOND);
    });
    expect(result.current.timeRemaining).toBe("01m 58s");
  });

  test("should flip to expired on the tick that crosses the deadline", () => {
    const expiresAt = Date.now() + 2 * SECOND;
    const { result } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current).toEqual({ timeRemaining: "02s", isExpired: false });

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toEqual({ timeRemaining: "01s", isExpired: false });

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(result.current).toEqual({ timeRemaining: "", isExpired: true });
  });

  test("should stop ticking once expired", () => {
    const expiresAt = Date.now() + 1 * SECOND;
    renderHook(() => useTimeRemaining(expiresAt * 1000));

    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  test("should clear interval on unmount", () => {
    const expiresAt = Date.now() + 1 * HOUR;
    const { result, unmount } = renderHook(() => useTimeRemaining(expiresAt * 1000));

    expect(result.current.timeRemaining).toBe("01h 00m 00s");

    unmount();

    // Advance time after unmount - should not cause errors
    act(() => {
      jest.advanceTimersByTime(1 * SECOND);
    });
  });
});

describe("useWithdrawableBalance", () => {
  const PARTY = "test-party-id";
  const DSO = "DSO::1220";
  const PAST_MICROS = (Date.now() - 60_000) * 1000;
  const FUTURE_MICROS = (Date.now() + 60_000) * 1000;

  const makeParent = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proposals: any[],
    resources: { nativeInstrumentAdmin?: string } = { nativeInstrumentAdmin: DSO },
  ) =>
    ({
      type: "Account",
      xpub: PARTY,
      currency: { id: "canton", units: [{ code: "CC", magnitude: 10, name: "Amulet" }] },
      cantonResources: { pendingTransferProposals: proposals, ...resources },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  const expiredOutgoing = (amount: string, instrument_id: string, instrument_admin: string) => ({
    sender: PARTY,
    amount,
    expires_at_micros: PAST_MICROS,
    instrument_id,
    instrument_admin,
  });

  test("returns 0 when account has no canton resources", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account = { type: "Account", xpub: PARTY } as any;
    const { result } = renderHook(() => useWithdrawableBalance(account, []));
    expect(result.current.toString()).toBe("0");
  });

  test("sums only outgoing AND expired native proposals on a parent account", () => {
    const parent = makeParent([
      expiredOutgoing("1000", "Amulet", DSO),
      // outgoing but not expired → skip
      { ...expiredOutgoing("2000", "Amulet", DSO), expires_at_micros: FUTURE_MICROS },
      // incoming, expired → skip
      { ...expiredOutgoing("4000", "Amulet", DSO), sender: "someone-else" },
    ]);
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("1000"));
  });

  test("excludes token proposals from the parent-account sum (would mis-render as native unit)", () => {
    const parent = makeParent([
      expiredOutgoing("500", "Amulet", DSO),
      expiredOutgoing("99999999", "cbtc-instrument-id", "cbtc-admin"),
    ]);
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("500"));
  });

  test("excludes another admin's instrument under the native id from the parent-account sum", () => {
    const parent = makeParent([
      expiredOutgoing("500", "Amulet", DSO),
      expiredOutgoing("700", "Amulet", "impostor::1220"),
    ]);
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("500"));
  });

  test("counts nothing as native on the parent until sync stores the DSO party", () => {
    const parent = makeParent([expiredOutgoing("500", "Amulet", DSO)], {});
    const { result } = renderHook(() => useWithdrawableBalance(parent, [parent]));
    expect(result.current).toEqual(new BigNumber("0"));
  });

  test("token sub-account sums its own (already-filtered) proposals", () => {
    const subAccount = {
      type: "TokenAccount",
      parentId: "parent-id",
      cantonResources: {
        pendingTransferProposals: [expiredOutgoing("123", "cbtc-instrument-id", "cbtc-admin")],
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

describe("useCantonOfferTokens", () => {
  const CBTC_ADMIN = "cbtc-network::1220";
  const CBTC = { id: "canton/cbtc", contractAddress: CBTC_ADMIN, units: [] };
  const mockedGetCalTokens = jest.mocked(getCalTokensCached);
  const findTokenById = jest.fn();

  const accountWithOffers = (...instrumentIds: string[]) =>
    ({
      type: "Account",
      currency: { id: "canton_network" },
      cantonResources: {
        pendingTransferProposals: instrumentIds.map(instrument_id => ({
          instrument_id,
          instrument_admin: CBTC_ADMIN,
        })),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (getCryptoAssetsStore as jest.Mock).mockReturnValue({ findTokenById });
    findTokenById.mockImplementation(async (id: string) => (id === CBTC.id ? CBTC : undefined));
  });

  test("keys the CAL tokens of the account's offers by instrument id and admin", async () => {
    mockedGetCalTokens.mockResolvedValue(
      new Map([
        [CBTC.id, "CBTC"],
        ["canton/not-offered", "OTHER"],
      ]),
    );

    const { result } = renderHook(() => useCantonOfferTokens(accountWithOffers("CBTC", "CBTC")));

    await waitFor(() => expect(result.current.get(instrumentKey("CBTC", CBTC_ADMIN))).toBe(CBTC));
    expect(result.current.size).toBe(1);
    expect(findTokenById).toHaveBeenCalledTimes(1);
  });

  test("reads nothing from CAL when the account has no offers", () => {
    const { result } = renderHook(() => useCantonOfferTokens(accountWithOffers()));

    expect(result.current.size).toBe(0);
    expect(mockedGetCalTokens).not.toHaveBeenCalled();
  });

  test("stays empty when CAL can't be read", async () => {
    mockedGetCalTokens.mockRejectedValue(new Error("CAL down"));

    const { result } = renderHook(() => useCantonOfferTokens(accountWithOffers("CBTC")));

    await waitFor(() => expect(mockedGetCalTokens).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });

  test("keeps the loaded tokens when the same offers come back in another order", async () => {
    const composed = String.fromCharCode(0xe9);
    const decomposed = `e${String.fromCharCode(0x301)}`;
    mockedGetCalTokens.mockResolvedValue(new Map([[CBTC.id, composed]]));
    const { result, rerender } = renderHook(({ account }) => useCantonOfferTokens(account), {
      initialProps: { account: accountWithOffers(composed, decomposed) },
    });
    await waitFor(() => expect(result.current.size).toBe(1));

    rerender({ account: accountWithOffers(decomposed, composed) });

    expect(result.current.size).toBe(1);
    expect(mockedGetCalTokens).toHaveBeenCalledTimes(1);
  });

  test("never returns the tokens loaded for other offers", async () => {
    mockedGetCalTokens.mockResolvedValueOnce(new Map([[CBTC.id, "CBTC"]]));
    const { result, rerender } = renderHook(({ account }) => useCantonOfferTokens(account), {
      initialProps: { account: accountWithOffers("CBTC") },
    });
    await waitFor(() => expect(result.current.size).toBe(1));

    mockedGetCalTokens.mockRejectedValueOnce(new Error("CAL down"));
    rerender({ account: accountWithOffers("CBTC", "ETHX") });
    expect(result.current.size).toBe(0);

    await act(async () => {});
    expect(mockedGetCalTokens).toHaveBeenCalledTimes(2);
    expect(result.current.size).toBe(0);
  });
});
