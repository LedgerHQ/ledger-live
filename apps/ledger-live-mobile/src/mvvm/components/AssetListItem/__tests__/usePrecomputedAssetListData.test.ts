import { renderHook } from "@tests/test-renderer";
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

const mockState = { data: {}, status: {}, cache: {} };

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
    expect(btcData?.deltaText).toBe("+3.50%");
    expect(btcData?.deltaColor).toBe("success");

    const ethData = result.current.get(ethereum.id);
    expect(ethData).toBeDefined();
  });

  it("should show dash delta for placeholder assets", () => {
    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 0), isPlaceholder: true }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    const data = result.current.get(bitcoin.id);
    expect(data?.deltaText).toBe("–");
    expect(data?.deltaColor).toBe("muted");
    expect(mockedGetCurrencyPortfolio).not.toHaveBeenCalled();
  });

  it("should skip portfolio computation for assets with no accounts", () => {
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(mockedGetCurrencyPortfolio).not.toHaveBeenCalled();
    expect(result.current.get(bitcoin.id)?.deltaText).toBe("–");
  });

  it("should return null countervalue when calculate returns undefined", () => {
    mockedCalculate.mockReturnValue(undefined);
    const assets: Asset[] = [createCryptoAsset(bitcoin, 100_000)];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.formattedCounterValue).toBeNull();
  });

  it("should format negative delta correctly", () => {
    const btcAccount = genAccount("btc-neg", { currency: getCryptoCurrencyById("bitcoin") });
    mockedGetCurrencyPortfolio.mockReturnValue(makePortfolio(-0.012));

    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.deltaText).toBe("-1.20%");
    expect(result.current.get(bitcoin.id)?.deltaColor).toBe("error");
  });

  it("should format zero delta as muted", () => {
    const btcAccount = genAccount("btc-zero", { currency: getCryptoCurrencyById("bitcoin") });
    mockedGetCurrencyPortfolio.mockReturnValue(makePortfolio(0));

    const assets: Asset[] = [{ ...createCryptoAsset(bitcoin, 100_000), accounts: [btcAccount] }];

    const { result } = renderHook(() => usePrecomputedAssetListData(assets));

    expect(result.current.get(bitcoin.id)?.deltaText).toBe("0.00%");
    expect(result.current.get(bitcoin.id)?.deltaColor).toBe("muted");
  });
});
