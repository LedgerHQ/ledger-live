import { BigNumber } from "bignumber.js";
import { renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import type {
  SponsoredCoinApi,
  SponsoredFeeQuote,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import {
  TRON_USDT_FEE_ASSET,
  createMockAccount,
  createMockCurrency,
  createMockTronUsdtAccount,
} from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import { useSponsoredFee } from "../useSponsoredFee";
import type { Account } from "@ledgerhq/types-live";

const mockCalculateCountervalue = jest.fn();
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
}));

const usdtAccount = createMockTronUsdtAccount();
const tronAccount: Account = createMockAccount({
  currency: createMockCurrency({ id: "tron" }),
  subAccounts: [usdtAccount],
});

// Stable across renders: an inline `{}` would change identity on every render and re-run the effect.
const INTENT = {};

const SPONSORED_OPTION = { id: "sponsored-fixture", feeAsset: TRON_USDT_FEE_ASSET };
const STANDARD_OPTION = { id: "standard", feeAsset: { type: "native" } };

function initialStateFor(flagEnabled: boolean) {
  return {
    ...withFlagOverrides({ gasSponsorship: { enabled: flagEnabled } }),
    settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
  };
}

function fakeSeam(overrides: Partial<SponsoredCoinApi>): SponsoredCoinApi {
  return {
    feeOptionId: "sponsored-fixture",
    providerName: "Provider",
    waivesErrorKeys: [],
    waivesWarningKeys: [],
    reservationDedupKey: jest.fn().mockReturnValue("1.5"),
    listFeeOptions: jest.fn().mockResolvedValue([]),
    estimateSponsoredFeeQuote: jest.fn(),
    buildEnergyRentRequest: jest.fn(),
    craftEnergyRentTransaction: jest.fn(),
    submitEnergyRentPayment: jest.fn(),
    getEnergyRentStatus: jest.fn(),
    awaitEnergyDelivery: jest.fn(),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
    getEnergyRentSignaturePayload: jest.fn(),
    buildSignedEnergyRentTransaction: jest.fn(),
    rentPayment: jest.fn(),
    ...overrides,
  };
}

const usdtQuote = (value: bigint, originalValue: bigint): SponsoredFeeQuote => ({
  feeAsset: TRON_USDT_FEE_ASSET,
  value,
  originalValue,
});

function sponsoredSeam(quote: SponsoredFeeQuote) {
  return fakeSeam({
    listFeeOptions: jest.fn().mockResolvedValue([SPONSORED_OPTION, STANDARD_OPTION]),
    estimateSponsoredFeeQuote: jest.fn().mockResolvedValue(quote),
  });
}

// USDT converts 1:1 and TRX 2:1, so the two fees land on different fiat amounts.
const priceUsdtAtOneAndTrxAtTwo = (currency: { type: string }, value: BigNumber) =>
  currency.type === "TokenCurrency" ? value : value.times(2);

describe("useSponsoredFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateCountervalue.mockReturnValue(undefined);
  });

  it("flag off: never calls the seam and reports unavailable with no quote", async () => {
    const seam = fakeSeam({});
    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(false) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(seam.listFeeOptions).not.toHaveBeenCalled();
    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.feeAsset).toBeNull();
    expect(result.current.savingsFiat).toBeNull();
  });

  it("flag on, no seam (non-sponsored family): unavailable with no quote", async () => {
    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam: null, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.feeAsset).toBeNull();
  });

  it("flag on, listFeeOptions advertises only the standard option: unavailable, quote never estimated", async () => {
    const listFeeOptions = jest.fn().mockResolvedValue([STANDARD_OPTION]);
    const estimateSponsoredFeeQuote = jest.fn();
    const seam = fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote });

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listFeeOptions).toHaveBeenCalledWith(INTENT);
    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.feeAsset).toBeNull();
    expect(estimateSponsoredFeeQuote).not.toHaveBeenCalled();
  });

  it("flag on, the sponsored option advertised: available, with its fee asset and the sub-account paying it", async () => {
    const quote = usdtQuote(3_200_000n, 6_430_000n);
    const seam = sponsoredSeam(quote);

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(true);
    expect(seam.estimateSponsoredFeeQuote).toHaveBeenCalledWith(INTENT);
    expect(result.current.quote).toEqual(quote);
    expect(result.current.feeAsset).toEqual(TRON_USDT_FEE_ASSET);
    expect(result.current.feeCurrencyTicker).toBe("USDT");
    expect(result.current.feeTokenAccount).toBe(usdtAccount);
    expect(result.current.standardFeeFiat).toBeNull();
    expect(result.current.sponsoredFeeFiat).toBeNull();
    expect(result.current.savingsFiat).toBeNull();
  });

  it("flag on, listFeeOptions rejects (seam regression): settles unavailable, not stuck loading, no unhandled rejection", async () => {
    const listFeeOptions = jest.fn().mockRejectedValue(new Error("listFeeOptions blew up"));
    const estimateSponsoredFeeQuote = jest.fn();
    const seam = fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote });

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.feeAsset).toBeNull();
    expect(estimateSponsoredFeeQuote).not.toHaveBeenCalled();
  });

  it("flag on, sponsored option advertised but estimateSponsoredFeeQuote rejects: withdraws the option and its fee asset", async () => {
    const listFeeOptions = jest.fn().mockResolvedValue([SPONSORED_OPTION]);
    const estimateSponsoredFeeQuote = jest.fn().mockRejectedValue(new Error("not eligible"));
    const seam = fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote });

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.feeAsset).toBeNull();
  });

  it("prices each fee in its own currency and reports the fiat saving", async () => {
    mockCalculateCountervalue.mockImplementation(priceUsdtAtOneAndTrxAtTwo);
    const seam = sponsoredSeam(usdtQuote(3n, 5n));

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.savingsFiat).toEqual(new BigNumber(7)));
    expect(result.current.standardFeeFiat).toEqual(new BigNumber(10));
    expect(result.current.sponsoredFeeFiat).toEqual(new BigNumber(3));
    expect(mockCalculateCountervalue).toHaveBeenCalledWith(tronAccount.currency, new BigNumber(5));
    expect(mockCalculateCountervalue).toHaveBeenCalledWith(usdtAccount.token, new BigNumber(3));
  });

  it.each([
    ["costs as much as", 10n],
    ["costs more than", 11n],
  ])(
    "reports no saving when the sponsored fee %s the standard one",
    async (_label, sponsoredValue) => {
      mockCalculateCountervalue.mockImplementation(priceUsdtAtOneAndTrxAtTwo);
      const seam = sponsoredSeam(usdtQuote(sponsoredValue, 5n));

      const { result } = renderHook(
        () => useSponsoredFee({ mainAccount: tronAccount, seam, intent: INTENT }),
        { initialState: initialStateFor(true) },
      );

      await waitFor(() =>
        expect(result.current.sponsoredFeeFiat).toEqual(new BigNumber(sponsoredValue.toString())),
      );
      expect(result.current.standardFeeFiat).toEqual(new BigNumber(10));
      expect(result.current.savingsFiat).toBeNull();
    },
  );

  it("prices no sponsored fee and no saving when the account holds no fee token", async () => {
    mockCalculateCountervalue.mockImplementation(priceUsdtAtOneAndTrxAtTwo);
    const seam = sponsoredSeam(usdtQuote(3n, 5n));
    const noFeeTokenAccount = createMockAccount({
      currency: createMockCurrency({ id: "tron" }),
      subAccounts: [],
    });

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: noFeeTokenAccount, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.standardFeeFiat).toEqual(new BigNumber(10)));
    expect(result.current.feeTokenAccount).toBeNull();
    expect(result.current.sponsoredFeeFiat).toBeNull();
    expect(result.current.savingsFiat).toBeNull();
  });

  it("names the fee currency from the fee asset but prices nothing without a main account", async () => {
    mockCalculateCountervalue.mockImplementation(priceUsdtAtOneAndTrxAtTwo);
    const quote = usdtQuote(3n, 5n);
    const seam = sponsoredSeam(quote);

    const { result } = renderHook(
      () => useSponsoredFee({ mainAccount: null, seam, intent: INTENT }),
      { initialState: initialStateFor(true) },
    );

    await waitFor(() => expect(result.current.quote).toEqual(quote));
    expect(result.current.feeCurrencyTicker).toBe("USDT");
    expect(result.current.feeTokenAccount).toBeNull();
    expect(result.current.standardFeeFiat).toBeNull();
    expect(result.current.sponsoredFeeFiat).toBeNull();
    expect(result.current.savingsFiat).toBeNull();
  });
});
