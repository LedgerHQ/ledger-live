import type { Features } from "@shared/feature-flags";
import {
  getAddressPoisoningFamiliesForFilter,
  getConfirmationsNbForCurrency,
  isOperationUnread,
  parseLastSeenMs,
} from "../historyOperationItems";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const bitcoinCurrency = BTC_ACCOUNT.currency;

describe("parseLastSeenMs", () => {
  it("maps null, empty, and valid ISO to ms or null", () => {
    expect(parseLastSeenMs(null)).toBeNull();
    expect(parseLastSeenMs("")).toBeNull();
    expect(parseLastSeenMs("2024-06-01T12:00:00.000Z")).toBe(
      new Date("2024-06-01T12:00:00.000Z").getTime(),
    );
  });
});

describe("isOperationUnread", () => {
  const t = new Date("2024-12-01T00:00:00.000Z").getTime();

  it("compares operation time to lastSeenTs", () => {
    expect(isOperationUnread(new Date(), null)).toBe(false);
    expect(isOperationUnread(new Date(t), t)).toBe(false);
    expect(isOperationUnread(new Date(t - 1), t)).toBe(false);
    expect(isOperationUnread(new Date(t + 1), t)).toBe(true);
  });
});

describe("getAddressPoisoningFamiliesForFilter", () => {
  it("returns null when shouldFilter is false", () => {
    expect(getAddressPoisoningFamiliesForFilter(false, undefined)).toBeNull();
  });

  it("when shouldFilter is true and feature is off or missing, returns split ADDRESS_POISONING_FAMILIES from env", () => {
    const fromEnv = getAddressPoisoningFamiliesForFilter(true, undefined);
    expect(fromEnv).not.toBeNull();
    expect(fromEnv!.every(f => f.length > 0)).toBe(true);

    const whenDisabled = getAddressPoisoningFamiliesForFilter(true, {
      enabled: false,
      params: { families: ["ignored"] },
    } satisfies Features["addressPoisoningOperationsFilter"]);
    expect(whenDisabled).toEqual(fromEnv);
  });

  it("returns feature params families when feature is enabled", () => {
    expect(
      getAddressPoisoningFamiliesForFilter(true, {
        enabled: true,
        params: { families: ["solana", "xrp"] },
      } satisfies Features["addressPoisoningOperationsFilter"]),
    ).toEqual(["solana", "xrp"]);
  });
});

describe("getConfirmationsNbForCurrency", () => {
  it("uses settings when present for the currency ticker", () => {
    expect(
      getConfirmationsNbForCurrency(
        {
          [bitcoinCurrency.ticker]: {
            confirmationsNb: 7,
            unit: bitcoinCurrency.units[0],
          },
        },
        bitcoinCurrency,
      ),
    ).toBe(7);
  });

  it("falls back to currency defaults when settings are missing", () => {
    const n = getConfirmationsNbForCurrency({}, bitcoinCurrency);
    expect(typeof n).toBe("number");
    expect(Number.isFinite(n)).toBe(true);
  });
});
