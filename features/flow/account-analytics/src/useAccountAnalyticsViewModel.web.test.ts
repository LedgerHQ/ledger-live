import { FiatCurrencyTickerSchema, type FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { analyticsCatalog, deferred, readyBalance } from "./analytics.mock";
import { useAccountAnalyticsViewModel } from "./useAccountAnalyticsViewModel";
import type {
  AccountAnalyticsDataPort,
  AnalyticsBalanceData,
  AnalyticsCatalogState,
  AnalyticsPeriod,
  AnalyticsReadResult,
} from "./types";

const usd = FiatCurrencyTickerSchema.parse("USD");
const eur = FiatCurrencyTickerSchema.parse("EUR");

const catalog: AnalyticsCatalogState = { status: "ready", data: analyticsCatalog };

describe("useAccountAnalyticsViewModel", () => {
  it("should keep the selected Bitcoin account when the chart range changes", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const { result, rerender } = renderHook(
      ({ period }: { period: AnalyticsPeriod }) =>
        useAccountAnalyticsViewModel({
          catalog,
          fiatCurrencyId: usd,
          period,
          dataPort: { loadBalance },
        }),
      { initialProps: { period: "1d" as AnalyticsPeriod } },
    );
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    act(() => result.current.selectAsset("btc"));
    act(() => result.current.selectAccount("btc-account"));
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    const positionIds = result.current.context.positionIds;
    rerender({ period: "1m" });
    expect(result.current.context.positionIds).toBe(positionIds);
    expect(result.current.selection).toEqual({
      assetId: "btc",
      accountId: "btc-account",
      metric: "balance",
    });
    expect(loadBalance.mock.calls.at(-1)?.[0]).toMatchObject({
      assetId: "btc",
      accountId: "btc-account",
      period: "1m",
      positionIds: ["btc-native"],
    });
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
  });

  it.each([false, true])(
    "should read only once when the host recreates catalog data (clone rows: %s)",
    async cloneRows => {
      const loadBalance = jest.fn().mockResolvedValue(readyBalance());
      const { result, rerender } = renderHook(() =>
        useAccountAnalyticsViewModel({
          catalog: {
            status: "ready",
            data: {
              assets: cloneRows
                ? analyticsCatalog.assets.map(asset => ({ ...asset }))
                : analyticsCatalog.assets,
              accounts: cloneRows
                ? analyticsCatalog.accounts.map(account => ({ ...account }))
                : analyticsCatalog.accounts,
              positions: cloneRows
                ? analyticsCatalog.positions.map(position => ({ ...position }))
                : analyticsCatalog.positions,
            },
          },
          fiatCurrencyId: usd,
          period: "1m",
          initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
          dataPort: { loadBalance },
        }),
      );
      await waitFor(() => expect(result.current.balance.status).toBe("ready"));
      rerender();
      expect(result.current.balance.status).toBe("ready");
      expect(result.current.selection.accountId).toBe("eth-account");
      expect(loadBalance).toHaveBeenCalledTimes(1);
    },
  );

  it("should invalidate an active read when catalog content changes with the same position IDs", async () => {
    const previous = deferred<AnalyticsReadResult<AnalyticsBalanceData>>();
    const refreshed = deferred<AnalyticsReadResult<AnalyticsBalanceData>>();
    const loadBalance = jest
      .fn()
      .mockImplementationOnce(() => previous.promise)
      .mockImplementationOnce(() => refreshed.promise);
    const { result, rerender } = renderHook(
      ({ source }: { source: AnalyticsCatalogState }) =>
        useAccountAnalyticsViewModel({
          catalog: source,
          fiatCurrencyId: usd,
          period: "1m",
          dataPort: { loadBalance },
        }),
      { initialProps: { source: catalog } },
    );
    const previousKey = result.current.contextKey;
    rerender({
      source: {
        status: "ready",
        data: {
          ...analyticsCatalog,
          assets: analyticsCatalog.assets.map(asset => ({
            ...asset,
            name: `${asset.name} updated`,
          })),
        },
      },
    });
    expect(result.current.assets[0].name).toBe("Ethereum updated");
    expect(result.current.contextKey).toBe(previousKey);
    expect(result.current.balance.status).toBe("loading");
    expect(loadBalance).toHaveBeenCalledTimes(2);
    expect(loadBalance.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => previous.resolve(readyBalance(50)));
    expect(result.current.balance.status).toBe("loading");
    await act(async () => refreshed.resolve(readyBalance(200)));
    expect(result.current.balance).toEqual(readyBalance(200));
  });

  it("should load the native position from card context even when its amount is zero", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance(0));
    const { result } = renderHook(() =>
      useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
        dataPort: { loadBalance },
      }),
    );
    await waitFor(() => expect(result.current.balance).toEqual(readyBalance(0)));
    expect(result.current.context.positionIds).toEqual(["eth-native"]);
  });

  it("should ignore old responses across A to B to A even when cancellation is ignored", async () => {
    const requests = Array.from({ length: 3 }, () =>
      deferred<AnalyticsReadResult<AnalyticsBalanceData>>(),
    );
    const loadBalance = jest
      .fn()
      .mockImplementationOnce(() => requests[0].promise)
      .mockImplementationOnce(() => requests[1].promise)
      .mockImplementationOnce(() => requests[2].promise);
    const { result } = renderHook(() =>
      useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        dataPort: { loadBalance },
      }),
    );
    act(() => result.current.selectAsset("usdc"));
    act(() => result.current.selectAsset(null));
    await act(async () => {
      requests[2].resolve(readyBalance(300));
    });
    expect(result.current.balance).toEqual(readyBalance(300));
    await act(async () => {
      requests[0].resolve(readyBalance(100));
      requests[1].resolve(readyBalance(200));
    });
    expect(result.current.balance).toEqual(readyBalance(300));
    expect(loadBalance.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("should remove previous values immediately when selection changes", async () => {
    const pending = deferred<AnalyticsReadResult<AnalyticsBalanceData>>();
    const loadBalance = jest
      .fn()
      .mockResolvedValueOnce(readyBalance())
      .mockImplementation(() => pending.promise);
    const committed: { assetId: string | null; status: string }[] = [];
    const { result } = renderHook(() => {
      const viewModel = useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        dataPort: { loadBalance },
      });
      useLayoutEffect(() => {
        committed.push({ assetId: viewModel.selection.assetId, status: viewModel.balance.status });
      });
      return viewModel;
    });
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    committed.length = 0;
    act(() => result.current.selectAsset("usdc"));
    expect(committed[0]).toEqual({ assetId: "usdc", status: "loading" });
    expect(result.current.selection.assetId).toBe("usdc");
    expect(result.current.balance).toEqual({ status: "loading" });
    expect(result.current.assets).toHaveLength(3);
  });

  it("should retain selection and distinguish an error from unavailable data on Retry", async () => {
    const loadBalance = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "unavailable" });
    const { result } = renderHook(() =>
      useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        initialSelection: { accountId: "eth-account", currencyId: "ethereum/erc20/usdc" },
        dataPort: { loadBalance },
      }),
    );
    await waitFor(() => expect(result.current.balance.status).toBe("error"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.balance.status).toBe("unavailable"));
    expect(result.current.selection).toEqual({
      assetId: "usdc",
      accountId: "eth-account",
      metric: "balance",
    });
    expect(loadBalance.mock.calls[0][0]).toEqual(loadBalance.mock.calls[1][0]);
  });

  it("should preserve selection and labels during transient catalog loading and failure", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const { result, rerender } = renderHook(
      ({ source }: { source: AnalyticsCatalogState }) =>
        useAccountAnalyticsViewModel({
          catalog: source,
          fiatCurrencyId: usd,
          period: "1m",
          initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
          dataPort: { loadBalance },
        }),
      { initialProps: { source: catalog as AnalyticsCatalogState } },
    );
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    rerender({ source: { status: "loading" } });
    expect(result.current.selection.accountId).toBe("eth-account");
    expect(result.current.assets).toHaveLength(3);
    expect(result.current.balance.status).toBe("loading");
    rerender({ source: { status: "error" } });
    expect(result.current.selection.accountId).toBe("eth-account");
    expect(result.current.balance.status).toBe("error");
  });

  it("should wait for the catalog before resolving card entry and fall back after an account is removed", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const { result, rerender } = renderHook(
      ({ source }: { source: AnalyticsCatalogState }) =>
        useAccountAnalyticsViewModel({
          catalog: source,
          fiatCurrencyId: usd,
          period: "1m",
          initialSelection: { accountId: "eth-account", currencyId: "ethereum/erc20/usdc" },
          dataPort: { loadBalance },
        }),
      { initialProps: { source: { status: "loading" } as AnalyticsCatalogState } },
    );
    expect(loadBalance).not.toHaveBeenCalled();
    rerender({ source: catalog });
    await waitFor(() => expect(result.current.selection.accountId).toBe("eth-account"));
    rerender({
      source: {
        status: "ready",
        data: {
          ...analyticsCatalog,
          accounts: analyticsCatalog.accounts.filter(a => a.id !== "eth-account"),
          positions: analyticsCatalog.positions.filter(p => p.accountId !== "eth-account"),
        },
      },
    });
    expect(result.current.selection).toEqual({
      assetId: "usdc",
      accountId: null,
      metric: "balance",
    });
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
  });

  it("should invalidate balance for a changed fiat, period or data source", async () => {
    const pending = deferred<AnalyticsReadResult<AnalyticsBalanceData>>();
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const port: AccountAnalyticsDataPort = { loadBalance };
    const { result, rerender } = renderHook(
      ({
        fiat,
        period,
        dataPort,
      }: {
        fiat: FiatCurrencyTicker;
        period: "1m" | "1y";
        dataPort: AccountAnalyticsDataPort;
      }) => useAccountAnalyticsViewModel({ catalog, fiatCurrencyId: fiat, period, dataPort }),
      { initialProps: { fiat: usd, period: "1m" as "1m" | "1y", dataPort: port } },
    );
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    loadBalance.mockImplementation(() => pending.promise);
    rerender({ fiat: eur, period: "1y", dataPort: port });
    expect(result.current.balance.status).toBe("loading");
    expect(loadBalance.mock.calls.at(-1)?.[0]).toMatchObject({
      fiatCurrencyId: eur,
      period: "1y",
    });
    const replacement = jest.fn().mockResolvedValue(readyBalance(200));
    rerender({ fiat: eur, period: "1y", dataPort: { loadBalance: replacement } });
    await waitFor(() => expect(result.current.balance).toEqual(readyBalance(200)));
    await act(async () => {
      pending.resolve(readyBalance(50));
    });
    expect(result.current.balance).toEqual(readyBalance(200));
  });

  it("should cancel the active request on unmount", () => {
    const pending = deferred<AnalyticsReadResult<AnalyticsBalanceData>>();
    const loadBalance = jest.fn().mockImplementation(() => pending.promise);
    const { unmount } = renderHook(() =>
      useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        dataPort: { loadBalance },
      }),
    );
    unmount();
    expect(loadBalance.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("should keep filters usable while the last successful catalog is refreshing", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const { result, rerender } = renderHook(
      ({ source }: { source: AnalyticsCatalogState }) =>
        useAccountAnalyticsViewModel({
          catalog: source,
          fiatCurrencyId: usd,
          period: "1m",
          dataPort: { loadBalance },
        }),
      { initialProps: { source: catalog as AnalyticsCatalogState } },
    );
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    rerender({ source: { status: "loading" } });
    act(() => result.current.selectAsset("usdc"));
    act(() => result.current.selectAccount("tron-account"));
    expect(result.current.selection).toEqual({
      assetId: "usdc",
      accountId: "tron-account",
      metric: "balance",
    });
    expect(loadBalance).toHaveBeenCalledTimes(1);
    rerender({ source: catalog });
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    expect(loadBalance.mock.calls.at(-1)?.[0].positionIds).toEqual(["tron-usdc"]);
  });

  it("should preserve card entry when the metric changes before the catalog arrives", async () => {
    const loadBalance = jest.fn().mockResolvedValue(readyBalance());
    const { result, rerender } = renderHook(
      ({ source }: { source: AnalyticsCatalogState }) =>
        useAccountAnalyticsViewModel({
          catalog: source,
          fiatCurrencyId: usd,
          period: "1m",
          initialSelection: { accountId: "eth-account", currencyId: "ethereum" },
          dataPort: { loadBalance },
        }),
      { initialProps: { source: { status: "loading" } as AnalyticsCatalogState } },
    );
    act(() => result.current.selectMetric("total-return"));
    rerender({ source: catalog });
    await waitFor(() => expect(result.current.balance.status).toBe("ready"));
    expect(result.current.selection).toEqual({
      assetId: "eth",
      accountId: "eth-account",
      metric: "total-return",
    });
    expect(loadBalance).toHaveBeenCalledTimes(1);
  });

  it("should reject an earlier Retry response for the same selection", async () => {
    const requests = [
      deferred<AnalyticsReadResult<AnalyticsBalanceData>>(),
      deferred<AnalyticsReadResult<AnalyticsBalanceData>>(),
    ];
    const loadBalance = jest
      .fn()
      .mockImplementationOnce(() => requests[0].promise)
      .mockImplementationOnce(() => requests[1].promise);
    const { result } = renderHook(() =>
      useAccountAnalyticsViewModel({
        catalog,
        fiatCurrencyId: usd,
        period: "1m",
        dataPort: { loadBalance },
      }),
    );
    act(() => result.current.retry());
    await act(async () => {
      requests[1].resolve(readyBalance(200));
    });
    await act(async () => {
      requests[0].resolve(readyBalance(100));
    });
    expect(result.current.balance).toEqual(readyBalance(200));
  });
});
