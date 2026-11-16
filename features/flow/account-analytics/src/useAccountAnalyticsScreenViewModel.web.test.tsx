import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAccountAnalyticsScreenViewModel } from "./useAccountAnalyticsScreenViewModel";
import { analyticsCatalog, readyBalance } from "./analytics.mock";
import type { AccountAnalyticsProps } from "./AccountAnalytics.types";

const resources = {
  en: {
    translation: {
      accountAnalytics: {
        assets: "Asset filter",
        accounts: "Account filter",
        allAssets: "All assets",
        allAccounts: "All accounts",
        error: "Unable to load analytics",
        unavailable: "Data unavailable",
      },
      common: { retry: "Retry" },
    },
  },
};

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
}

function createProps(): AccountAnalyticsProps {
  return {
    catalog: { status: "ready", data: analyticsCatalog },
    fiatCurrencyId: FiatCurrencyTickerSchema.parse("USD"),
    period: "1d",
    initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
    dataPort: { loadBalance: jest.fn().mockResolvedValue(readyBalance()) },
    renderBalance: () => null,
    renderPnl: () => null,
    onRefresh: jest.fn(),
  };
}

describe("Account Analytics screen ViewModel", () => {
  it("should provide localized filter labels and the resolved account entry", async () => {
    const props = createProps();
    const { result } = renderHook(() => useAccountAnalyticsScreenViewModel(props), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.model.balance.status).toBe("ready"));
    expect(result.current.labels).toMatchObject({
      assets: "Asset filter",
      accounts: "Account filter",
      allAssets: "All assets",
      retry: "Retry",
    });
    expect(result.current.scope).toMatchObject({ assetId: "eth", accountId: "eth-account" });
  });

  it("should keep the PnL scope identity unchanged across chart ranges and metrics", async () => {
    const props = createProps();
    const { result, rerender } = renderHook(
      (input: AccountAnalyticsProps) => useAccountAnalyticsScreenViewModel(input),
      { initialProps: props, wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.model.balance.status).toBe("ready"));
    const scope = result.current.scope;
    rerender({ ...props, period: "1y" });
    await waitFor(() => expect(result.current.model.balance.status).toBe("ready"));
    expect(result.current.scope).toBe(scope);
    act(() => result.current.model.selectMetric("unrealised-return"));
    await waitFor(() => expect(result.current.model.balance.status).toBe("ready"));
    expect(result.current.scope).toBe(scope);
    expect(props.dataPort.loadBalance).toHaveBeenLastCalledWith(
      expect.objectContaining({
        period: "1y",
        metric: "unrealised-return",
        accountId: "eth-account",
      }),
      expect.anything(),
    );
  });

  it("should refresh host data and retry a failed chart while retaining the account", async () => {
    const loadBalance = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(readyBalance());
    const props = { ...createProps(), dataPort: { loadBalance } };
    const { result } = renderHook(() => useAccountAnalyticsScreenViewModel(props), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.model.balance.status).toBe("error"));
    act(() => result.current.onRetry());
    await waitFor(() => expect(result.current.model.balance.status).toBe("ready"));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.scope).toMatchObject({ accountId: "eth-account", assetId: "eth" });
  });
});
