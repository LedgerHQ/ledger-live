import { renderHook, act } from "@tests/test-renderer";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getCurrencyPortfolio } from "@ledgerhq/live-countervalues/portfolio";
import { formatCurrencyUnit, getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { Asset } from "~/types/asset";
import { usePrecomputedAssetListData } from "../usePrecomputedAssetListData";
import { bitcoin, ethereum, createCryptoAsset } from "./shared";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCountervaluesState: jest.fn(),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: jest.fn(),
}));

jest.mock("@ledgerhq/live-countervalues/portfolio", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/portfolio"),
  getCurrencyPortfolio: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
  formatCurrencyUnit: jest.fn(),
}));

const mockedUseCountervaluesState = jest.mocked(useCountervaluesState);
const mockedCalculate = jest.mocked(calculate);
const mockedGetCurrencyPortfolio = jest.mocked(getCurrencyPortfolio);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);

const mockState: ReturnType<typeof useCountervaluesState> = { data: {}, status: {}, cache: {} };

const makePortfolio = (percentage: number | null) =>
  ({
    countervalueChange: { percentage, value: 0 },
    cryptoChange: { value: 0, percentage: null },
    history: [],
    countervalueAvailable: true,
    histories: [],
    accounts: [],
    range: "day",
  }) as ReturnType<typeof getCurrencyPortfolio>;

describe("usePrecomputedAssetListData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCountervaluesState.mockReturnValue(mockState);
    mockedCalculate.mockReturnValue(5000000);
    mockedFormatCurrencyUnit.mockReturnValue("$50,000.00");
    mockedGetCurrencyPortfolio.mockReturnValue(makePortfolio(0.035));
  });

  it("should batch-compute data with a single countervalues subscription", () => {
    const btcAccount = genAccount("btc", { currency: getCryptoCurrencyById("bitcoin") });
    const ethAccount = genAccount("eth", { currency: getCryptoCurrencyById("ethereum") });

    const assets: Asset[] = [
      { ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] },
      { ...createCryptoAsset(ethereum, 200_000), accounts: [ethAccount] },
    ];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(mockedUseCountervaluesState).toHaveBeenCalledTimes(1);
    expect(mockedCalculate).toHaveBeenCalledTimes(2);
    expect(mockedGetCurrencyPortfolio).toHaveBeenCalledTimes(2);

    const btcData = result.current.get(bitcoin.id);
    expect(btcData).toBeDefined();
    expect(btcData?.formattedCounterValue).toBe("$50,000.00");
    expect(btcData?.countervalueChange).toEqual({ percentage: 0.035, value: 0 });

    const ethData = result.current.get(ethereum.id);
    expect(ethData).toBeDefined();
  });

  it("should always pass 'day' as the range to getCurrencyPortfolio regardless of global time range", () => {
    const btcAccount = genAccount("btc-range", { currency: getCryptoCurrencyById("bitcoin") });

    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] }];

    renderHook(() => usePrecomputedAssetListData(assets));

    expect(mockedGetCurrencyPortfolio).toHaveBeenCalledWith(
      [btcAccount],
      "day",
      mockState,
      expect.objectContaining({ ticker: "USD" }),
    );
  });

  it("should preserve stable references when computed data has not changed", () => {
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result, rerender } = renderHook(() => usePrecomputedAssetListData(assets));

    const firstRef = result.current.get(bitcoin.id);
    expect(firstRef).toBeDefined();

    rerender({});

    const secondRef = result.current.get(bitcoin.id);
    expect(secondRef).toBe(firstRef);
  });

  it("should update reference when computed data changes after throttle", () => {
    jest.useFakeTimers();
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result, rerender } = renderHook(() => usePrecomputedAssetListData(assets));

    const firstRef = result.current.get(bitcoin.id);

    mockedFormatCurrencyUnit.mockReturnValue("$60,000.00");
    const newState: ReturnType<typeof useCountervaluesState> = {
      data: { btc: new Map() },
      status: {},
      cache: {},
    };
    mockedUseCountervaluesState.mockReturnValue(newState);
    rerender({});

    const midRef = result.current.get(bitcoin.id);
    expect(midRef?.formattedCounterValue).toBe("$50,000.00");

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    const secondRef = result.current.get(bitcoin.id);
    expect(secondRef).not.toBe(firstRef);
    expect(secondRef?.formattedCounterValue).toBe("$60,000.00");

    jest.useRealTimers();
  });

  it("should return null countervalueChange for placeholder assets", () => {
    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 0), isPlaceholder: true }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    const data = result.current.get(bitcoin.id);
    expect(data?.countervalueChange).toBeNull();
    expect(mockedGetCurrencyPortfolio).not.toHaveBeenCalled();
  });

  it("should skip portfolio computation for assets with no accounts", () => {
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(mockedGetCurrencyPortfolio).not.toHaveBeenCalled();
    expect(result.current.get(bitcoin.id)?.countervalueChange).toBeNull();
  });

  it("should return null countervalue when calculate returns undefined", () => {
    mockedCalculate.mockReturnValue(undefined);
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.formattedCounterValue).toBeNull();
  });

  it("should pass through negative countervalueChange", () => {
    const btcAccount = genAccount("btc-neg", { currency: getCryptoCurrencyById("bitcoin") });
    mockedGetCurrencyPortfolio.mockReturnValue(makePortfolio(-0.012));

    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.countervalueChange).toEqual({
      percentage: -0.012,
      value: 0,
    });
  });

  it("should pass through zero countervalueChange", () => {
    const btcAccount = genAccount("btc-zero", { currency: getCryptoCurrencyById("bitcoin") });
    mockedGetCurrencyPortfolio.mockReturnValue(makePortfolio(0));

    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.countervalueChange).toEqual({
      percentage: 0,
      value: 0,
    });
  });

  it("should return an empty map when assets is empty", () => {
    const { result } = renderHook(() => usePrecomputedAssetListData([]));

    expect(result.current.size).toBe(0);
    expect(mockedCalculate).not.toHaveBeenCalled();
    expect(mockedGetCurrencyPortfolio).not.toHaveBeenCalled();
  });

  it("should clean up removed currencies from cache", () => {
    const btcAsset = createCryptoAsset(bitcoin, 100_000);
    const ethAsset = createCryptoAsset(ethereum, 200_000);

    let assets = [btcAsset, ethAsset];
    const { result, rerender } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.has(bitcoin.id)).toBe(true);
    expect(result.current.has(ethereum.id)).toBe(true);

    assets = [btcAsset];
    rerender({});

    expect(result.current.has(bitcoin.id)).toBe(true);
    expect(result.current.has(ethereum.id)).toBe(false);
  });
});
