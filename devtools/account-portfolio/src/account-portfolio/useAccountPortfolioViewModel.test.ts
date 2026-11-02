import { act, renderHook } from "@testing-library/react";
import type {
  AccountPortfolioRequest,
  AccountPortfolioResult,
  AccountPortfolioToolProps,
} from "../types";
import { useAccountPortfolioViewModel } from "./useAccountPortfolioViewModel";

const result = (ok: boolean): AccountPortfolioResult => ({
  ok,
  durationMs: 5,
  sent: { method: "GET", url: "https://portfolio.test/v1/portfolio/p1" },
  body: {},
  currency: "usd",
});

const evm = {
  accountUUID: "uuid-evm",
  label: "ethereum 0xabc",
  registration: '{"type":"evm","address":"0xabc"}',
};
const bitcoin = {
  accountUUID: "uuid-btc",
  label: "bitcoin xpub",
  registration: '{"type":"auto_derive"}',
};

function setup(overrides: Partial<AccountPortfolioToolProps> = {}) {
  const onRun = jest.fn<Promise<AccountPortfolioResult>, [AccountPortfolioRequest]>(() =>
    Promise.resolve(result(true)),
  );
  const props: AccountPortfolioToolProps = {
    accounts: [evm, bitcoin],
    defaultPortfolioId: "p1",
    serviceUrl: "https://portfolio.test",
    onRun,
    ...overrides,
  };
  return { onRun, ...renderHook(() => useAccountPortfolioViewModel(props)) };
}

describe("useAccountPortfolioViewModel", () => {
  it("runs a call with the trimmed inputs", async () => {
    const { result: vm, onRun } = setup();
    act(() => vm.current.setCurrency(" eur "));
    act(() => vm.current.setAccountFilter(" acc-1 "));

    await act(() => vm.current.run("getBalance"));

    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "getBalance",
        portfolioId: "p1",
        currency: "eur",
        account: "acc-1",
      }),
    );
    expect(vm.current.selected?.action).toBe("getBalance");
  });

  it("refuses an invalid payload and blocks every call while the service is disabled", () => {
    const { result: vm } = setup();
    act(() => vm.current.setCustomPayload("{"));
    expect(vm.current.canRegister).toBe(false);
    expect(setup({ serviceUrl: "" }).result.current.blocked).toBe(true);
  });

  it("points at create, then register", async () => {
    const { result: vm } = setup();
    expect(vm.current.nextStep).toBe("createPortfolio");

    await act(() => vm.current.run("createPortfolio"));
    expect(vm.current.nextStep).toBe("registerAccounts");

    await act(() => vm.current.run("registerAccounts"));
    expect(vm.current.nextStep).toBeUndefined();
  });

  it("does not refill ids from an older read after the portfolio lists none", async () => {
    const portfolio = (ids: string[]): AccountPortfolioResult => ({
      ...result(true),
      view: {
        kind: "portfolio",
        id: "p1",
        registrations: ids.length,
        registrationEntries: ids.map(id => ({ id, type: "evm", detail: id })),
        accounts: [],
      },
    });
    const onRun = jest
      .fn<Promise<AccountPortfolioResult>, [AccountPortfolioRequest]>()
      .mockResolvedValueOnce(portfolio(["id-1"]))
      .mockResolvedValueOnce(portfolio([]));
    const { result: vm } = renderHook(() =>
      useAccountPortfolioViewModel({
        accounts: [],
        defaultPortfolioId: "p1",
        serviceUrl: "https://portfolio.test",
        onRun,
      }),
    );

    await act(() => vm.current.run("getPortfolio"));
    expect(vm.current.canFillRemoveIds).toBe(true);

    await act(() => vm.current.run("getPortfolio"));
    expect(vm.current.canFillRemoveIds).toBe(false);
  });

  it("narrows a balance to the lines that match", async () => {
    const onRun = jest.fn<Promise<AccountPortfolioResult>, [AccountPortfolioRequest]>(() =>
      Promise.resolve({
        ...result(true),
        view: {
          kind: "balance",
          hasMore: false,
          failures: [],
          entries: ["ETH", "USDC"].map(ticker => ({
            network: "base",
            asset: ticker,
            ticker,
            calId: `base/${ticker}`,
            amount: "1",
            accountId: "a",
            status: "confirmed" as const,
            estimated: false,
            locked: false,
          })),
        },
      }),
    );
    const { result: vm } = renderHook(() =>
      useAccountPortfolioViewModel({
        accounts: [],
        defaultPortfolioId: "p1",
        serviceUrl: "https://portfolio.test",
        onRun,
      }),
    );

    await act(() => vm.current.run("getBalance"));
    act(() => vm.current.setSearch("usdc"));

    const shown = vm.current.resultView;
    expect(shown?.kind === "balance" && shown.entries.map(entry => entry.ticker)).toEqual(["USDC"]);
    expect(vm.current.unmatchedCount).toBe(1);
  });
});
