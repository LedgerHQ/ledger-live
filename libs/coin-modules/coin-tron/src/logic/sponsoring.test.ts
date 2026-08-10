import type { TransactionIntent, Unit } from "@ledgerhq/coin-module-framework/api/types";
import BigNumber from "bignumber.js";
import type { TronMemo, TronTxData } from "../types";
import type { TronResourceBreakdown } from "./estimateFees";
import { computeSponsoredUsdtFee, resolveSponsoredEstimate } from "./sponsoring";

const mockGetEnergyProvider = jest.fn();
jest.mock("./energyProviders", () => ({
  getEnergyProvider: (...args: unknown[]) => mockGetEnergyProvider(...args),
}));

const mockGetEnergyRentQuote = jest.fn();
jest.mock("./energyRent", () => ({
  getEnergyRentQuote: (...args: unknown[]) => mockGetEnergyRentQuote(...args),
}));

const SENDER = "TFCAe8rzCpc1iQE485VE3Ymgj6ULAuhLH7";
const TRC20_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONIFY = { id: "tronify", name: "Tronify" };
const USDT_UNIT: Unit = { name: "Tether USD", code: "USDT", magnitude: 6 };

function makeIntent(
  overrides: Partial<TransactionIntent<TronMemo, TronTxData>> = {},
  data: Partial<TronTxData> = {},
): TransactionIntent<TronMemo, TronTxData> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    senderPublicKey: "",
    recipient: "TVqLYbpUXv5Q4j7krFr3duqf2GUZghDfQy",
    amount: 1_000_000n,
    asset: { type: "trc20", assetReference: TRC20_ADDRESS, unit: USDT_UNIT },
    useAllAmount: false,
    sequence: 0n,
    memo: { type: "none" },
    data: { type: "tron", energyProviderInfo: { providerId: "tronify", orderId: "o-1" }, ...data },
    ...overrides,
  } as TransactionIntent<TronMemo, TronTxData>;
}

const breakdown = (overrides: Partial<TronResourceBreakdown> = {}): TronResourceBreakdown => ({
  energyRequired: "65000",
  energyAvailable: "0",
  bandwidthRequired: "350",
  bandwidthAvailable: "0",
  energyEstimated: true,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetEnergyProvider.mockImplementation((id: string) =>
    id === "tronify" ? TRONIFY : undefined,
  );
  mockGetEnergyRentQuote.mockResolvedValue({
    energy: 65_000n,
    durationSeconds: 600,
    payCoinCode: "USDT",
    payCoinAmt: "13.74",
    fees: { energy: "0", trx: "0", bandwidth: "0", activateAccount: "0" },
  });
});

describe("resolveSponsoredEstimate (LIVE-32776)", () => {
  it("returns provider + avoided energy cost (SUN string) for a sponsored send", () => {
    // 65000 energy × 420 SUN/energy = 27_300_000 SUN.
    expect(resolveSponsoredEstimate(makeIntent(), new BigNumber(65_000), true, 420)).toEqual({
      sponsoredProviderId: "tronify",
      sponsoredProviderName: "Tronify",
      avoidedEnergyFeesSun: "27300000",
    });
  });

  it("rounds the avoided cost up (ROUND_CEIL)", () => {
    expect(
      resolveSponsoredEstimate(makeIntent(), new BigNumber(3), true, 1.5)?.avoidedEnergyFeesSun,
    ).toBe("5"); // 3 × 1.5 = 4.5 → 5
  });

  it("returns undefined when the send is not sponsored", () => {
    expect(
      resolveSponsoredEstimate(
        makeIntent({}, { energyProviderInfo: null }),
        new BigNumber(65_000),
        true,
        420,
      ),
    ).toBeUndefined();
  });

  it("returns undefined for an unknown provider id", () => {
    const intent = makeIntent({}, { energyProviderInfo: { providerId: "nope", orderId: "o" } });
    expect(resolveSponsoredEstimate(intent, new BigNumber(65_000), true, 420)).toBeUndefined();
  });

  it("returns undefined when energy could not be reliably estimated", () => {
    expect(
      resolveSponsoredEstimate(makeIntent(), new BigNumber(65_000), false, 420),
    ).toBeUndefined();
  });

  it("returns undefined when no energy is required (native/TRC10/covered)", () => {
    expect(resolveSponsoredEstimate(makeIntent(), new BigNumber(0), true, 420)).toBeUndefined();
  });
});

describe("computeSponsoredUsdtFee (LIVE-32777)", () => {
  it("reserves the quoted USDT rent in token base units for a sponsored TRC20 send", async () => {
    const fee = await computeSponsoredUsdtFee(makeIntent(), breakdown(), USDT_UNIT);
    // "13.74" USDT at magnitude 6 = 13_740_000 base units.
    expect(fee).toEqual(new BigNumber(13_740_000));
    expect(mockGetEnergyRentQuote).toHaveBeenCalledWith({
      payerAddress: SENDER,
      receiverAddress: SENDER,
      energy: 65_000n,
      durationSeconds: 600,
      extraTrx: 0.8,
    });
  });

  it("reserves nothing when the send is not sponsored", async () => {
    const intent = makeIntent({}, { energyProviderInfo: null });
    expect(await computeSponsoredUsdtFee(intent, breakdown(), USDT_UNIT)).toEqual(new BigNumber(0));
    expect(mockGetEnergyRentQuote).not.toHaveBeenCalled();
  });

  it("reserves nothing for an unknown provider id", async () => {
    const intent = makeIntent({}, { energyProviderInfo: { providerId: "nope", orderId: "o" } });
    expect(await computeSponsoredUsdtFee(intent, breakdown(), USDT_UNIT)).toEqual(new BigNumber(0));
  });

  it("reserves nothing for a non-TRC20 asset", async () => {
    const intent = makeIntent({ asset: { type: "native", unit: USDT_UNIT } });
    expect(await computeSponsoredUsdtFee(intent, breakdown(), USDT_UNIT)).toEqual(new BigNumber(0));
  });

  it("reserves nothing when energy was not reliably estimated", async () => {
    const b = breakdown({ energyEstimated: false });
    expect(await computeSponsoredUsdtFee(makeIntent(), b, USDT_UNIT)).toEqual(new BigNumber(0));
  });

  it("reserves nothing when no energy is required", async () => {
    const b = breakdown({ energyRequired: "0" });
    expect(await computeSponsoredUsdtFee(makeIntent(), b, USDT_UNIT)).toEqual(new BigNumber(0));
  });

  it("reserves nothing without a token unit to price with", async () => {
    expect(await computeSponsoredUsdtFee(makeIntent(), breakdown(), undefined)).toEqual(
      new BigNumber(0),
    );
  });

  it("reserves nothing when the rent is priced in a different currency (Flow 1 / TRX)", async () => {
    mockGetEnergyRentQuote.mockResolvedValue({
      energy: 65_000n,
      durationSeconds: 600,
      payCoinCode: "TRX",
      payCoinAmt: "6.4",
      fees: { energy: "0", trx: "0", bandwidth: "0", activateAccount: "0" },
    });
    expect(await computeSponsoredUsdtFee(makeIntent(), breakdown(), USDT_UNIT)).toEqual(
      new BigNumber(0),
    );
  });

  it("degrades to no reservation when the quote fails (e.g. energy-rent unconfigured)", async () => {
    mockGetEnergyRentQuote.mockRejectedValue(new Error("EnergyRentProviderNotConfigured"));
    expect(await computeSponsoredUsdtFee(makeIntent(), breakdown(), USDT_UNIT)).toEqual(
      new BigNumber(0),
    );
  });
});
