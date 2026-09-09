import { renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { getSponsoredCoinApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { SponsoredCoinApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import {
  createMockAccount,
  createMockCurrency,
} from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import { useSponsoredFee } from "../useSponsoredFee";
import type { Account } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
  SPONSORED_FEE_OPTION_ID: "tronify",
}));

const mockedGetSponsoredCoinApi = jest.mocked(getSponsoredCoinApi);

const tronAccount: Account = createMockAccount({ currency: createMockCurrency({ id: "tron" }) });

function initialStateFor(flagEnabled: boolean) {
  return {
    ...withFlagOverrides({ gasSponsorship: { enabled: flagEnabled } }),
    settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" },
  };
}

function fakeSeam(overrides: Partial<SponsoredCoinApi>): SponsoredCoinApi {
  return {
    listFeeOptions: jest.fn().mockResolvedValue([]),
    estimateSponsoredFeeQuote: jest.fn(),
    buildEnergyRentRequest: jest.fn(),
    craftEnergyRentTransaction: jest.fn(),
    submitEnergyRentPayment: jest.fn(),
    getEnergyRentStatus: jest.fn(),
    awaitEnergyDelivery: jest.fn(),
    ...overrides,
  };
}

describe("useSponsoredFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("flag off: never calls the seam and reports unavailable with no quote", async () => {
    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent: {} }), {
      initialState: initialStateFor(false),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetSponsoredCoinApi).not.toHaveBeenCalled();
    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.savingsFiat).toBeNull();
  });

  it("flag on, seam resolves null (non-TRON / unconfigured family): unavailable with no quote", async () => {
    mockedGetSponsoredCoinApi.mockResolvedValue(null);

    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent: {} }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetSponsoredCoinApi).toHaveBeenCalledWith("tron", "local");
    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
  });

  it("flag on, seam resolution rejects (module load / network failure): settles unavailable, not stuck loading, no unhandled rejection", async () => {
    mockedGetSponsoredCoinApi.mockRejectedValue(new Error("coin-module load failed"));

    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent: {} }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
  });

  it("flag on, listFeeOptions advertises only the standard option: unavailable, quote never estimated", async () => {
    const listFeeOptions = jest.fn().mockResolvedValue([{ id: "standard", feeAsset: {} }]);
    const estimateSponsoredFeeQuote = jest.fn();
    mockedGetSponsoredCoinApi.mockResolvedValue(
      fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote }),
    );

    const intent = { kind: "trc20-send" };
    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listFeeOptions).toHaveBeenCalledWith(intent);
    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(estimateSponsoredFeeQuote).not.toHaveBeenCalled();
  });

  it("flag on, tronify option advertised: available, quote resolved from the seam", async () => {
    const quote = { value: 1n, originalValue: 5n, savings: 4n };
    const listFeeOptions = jest.fn().mockResolvedValue([
      { id: "tronify", feeAsset: {} },
      { id: "standard", feeAsset: {} },
    ]);
    const estimateSponsoredFeeQuote = jest.fn().mockResolvedValue(quote);
    mockedGetSponsoredCoinApi.mockResolvedValue(
      fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote }),
    );

    const intent = { kind: "trc20-send", recipient: "TAbc" };
    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(true);
    expect(estimateSponsoredFeeQuote).toHaveBeenCalledWith(intent);
    expect(result.current.quote).toEqual(quote);
    // The bare renderHook harness seeds no countervalue rate (unlike
    // renderWithMockedCounterValuesProvider), so the fiat conversion has nothing to convert with.
    expect(result.current.savingsFiat).toBeNull();
  });

  it("flag on, listFeeOptions rejects (seam regression): settles unavailable, not stuck loading, no unhandled rejection", async () => {
    const listFeeOptions = jest.fn().mockRejectedValue(new Error("listFeeOptions blew up"));
    const estimateSponsoredFeeQuote = jest.fn();
    mockedGetSponsoredCoinApi.mockResolvedValue(
      fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote }),
    );

    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent: {} }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(estimateSponsoredFeeQuote).not.toHaveBeenCalled();
  });

  it("flag on, tronify available but estimateSponsoredFeeQuote rejects: settles with no quote, no unhandled rejection", async () => {
    const listFeeOptions = jest.fn().mockResolvedValue([{ id: "tronify", feeAsset: {} }]);
    const estimateSponsoredFeeQuote = jest.fn().mockRejectedValue(new Error("not eligible"));
    mockedGetSponsoredCoinApi.mockResolvedValue(
      fakeSeam({ listFeeOptions, estimateSponsoredFeeQuote }),
    );

    const { result } = renderHook(() => useSponsoredFee({ account: tronAccount, intent: {} }), {
      initialState: initialStateFor(true),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(true);
    expect(result.current.quote).toBeNull();
  });
});
