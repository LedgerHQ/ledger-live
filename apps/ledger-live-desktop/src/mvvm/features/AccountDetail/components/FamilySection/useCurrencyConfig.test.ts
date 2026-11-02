import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { act, renderHook } from "tests/testSetup";
import { subscribeToRemoteFlags } from "~/firebase/remoteConfig";
import { useCurrencyConfig } from "./useCurrencyConfig";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

jest.mock("~/firebase/remoteConfig", () => ({
  subscribeToRemoteFlags: jest.fn(),
}));

const mockedGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);
const mockedSubscribeToRemoteFlags = jest.mocked(subscribeToRemoteFlags);
const unsubscribe = jest.fn();

const currencyConfig = (overrides: Partial<CurrencyConfig> = {}): CurrencyConfig => {
  return {
    name: "Ethereum",
    unit: { name: "ether", code: "ETH", magnitude: 18 },
    status: { type: "active" },
    ...overrides,
  };
};

const renderEthereumConfig = () => {
  return renderHook(() => {
    return useCurrencyConfig("ethereum");
  });
};

const remoteFetch = () => {
  const [[onRemoteFetch]] = mockedSubscribeToRemoteFlags.mock.calls.slice(-1);
  act(() => {
    onRemoteFetch({ fetchedAt: Date.now() });
  });
};

describe("useCurrencyConfig", () => {
  beforeEach(() => {
    mockedSubscribeToRemoteFlags.mockReset().mockReturnValue(unsubscribe);
    mockedGetCurrencyConfiguration.mockReset().mockReturnValue(currencyConfig());
  });

  it("reads the currency config again after each remote config fetch", () => {
    const { result } = renderEthereumConfig();
    expect(result.current).toEqual(currencyConfig());

    mockedGetCurrencyConfiguration.mockReturnValue(currencyConfig({ disableDelegation: true }));
    remoteFetch();

    expect(result.current).toEqual(currencyConfig({ disableDelegation: true }));
  });

  it("returns no config when the currency has none", () => {
    mockedGetCurrencyConfiguration.mockImplementation(() => {
      throw new Error("missing config");
    });

    const { result } = renderEthereumConfig();

    expect(result.current).toBeUndefined();
  });

  it("reads the new currency config when the currency changes", () => {
    const { result, rerender } = renderHook(useCurrencyConfig, { initialProps: "ethereum" });
    const zcashConfig = currencyConfig({
      name: "Zcash",
      status: { type: "will_be_deprecated", deprecated_date: "2027-01-01", link: "" },
    });
    mockedGetCurrencyConfiguration.mockReturnValue(zcashConfig);

    rerender("zcash");

    expect(result.current).toEqual(zcashConfig);
    expect(mockedGetCurrencyConfiguration).toHaveBeenLastCalledWith("zcash");
  });

  it("stops listening to remote config fetches on unmount", () => {
    const { unmount } = renderEthereumConfig();

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
