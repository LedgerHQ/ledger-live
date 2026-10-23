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

const balanceView = (...tickers: string[]): NonNullable<AccountPortfolioResult["view"]> => ({
  kind: "balance",
  hasMore: false,
  failures: [],
  entries: tickers.map(ticker => ({
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
});

const shownTickers = (view: AccountPortfolioResult["view"]) =>
  view?.kind === "balance" ? view.entries.map(entry => entry.ticker) : [];

describe("useAccountPortfolioViewModel", () => {
  it("builds the registration of every account", () => {
    const { result: vm } = setup();
    expect(vm.current.registerLabel).toBe("Register 2 accounts");
    expect(vm.current.canRegister).toBe(true);
    expect(JSON.parse(vm.current.payload)).toEqual([
      { type: "evm", address: "0xabc" },
      { type: "auto_derive" },
    ]);
  });

  it("registers only the chosen account", () => {
    const { result: vm } = setup();
    act(() => vm.current.choose("uuid-btc"));
    expect(vm.current.registerLabel).toBe("Register 1 account");
    expect(JSON.parse(vm.current.payload)).toEqual([{ type: "auto_derive" }]);
  });

  it("cannot register when there is no account", () => {
    const { result: vm } = setup({ accounts: [] });
    expect(vm.current.hasAccounts).toBe(false);
    expect(vm.current.canRegister).toBe(false);
  });

  it("keeps a hand-written payload until another account is chosen", () => {
    const { result: vm } = setup();
    act(() => vm.current.setCustomPayload("[]"));
    expect(vm.current.isCustomPayload).toBe(true);
    expect(vm.current.registerLabel).toBe("Register this payload");

    act(() => vm.current.choose("uuid-evm"));
    expect(vm.current.isCustomPayload).toBe(false);
  });

  it("refuses an invalid payload", () => {
    const { result: vm } = setup();
    act(() => vm.current.setCustomPayload("{"));
    expect(vm.current.payloadValid).toBe(false);
    expect(vm.current.canRegister).toBe(false);
  });

  it("blocks every call while the service is disabled", () => {
    expect(setup({ serviceUrl: "" }).result.current.blocked).toBe(true);
    expect(setup().result.current.blocked).toBe(false);
  });

  it("reports an empty portfolio id apart", () => {
    expect(setup({ defaultPortfolioId: "  " }).result.current.portfolioMissing).toBe(true);
    expect(setup().result.current.portfolioMissing).toBe(false);
  });

  it("runs a call with the trimmed inputs and keeps it as the selected result", async () => {
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
    expect(vm.current.running).toBeUndefined();
    expect(vm.current.history).toHaveLength(1);
    expect(vm.current.selected?.action).toBe("getBalance");
  });

  it("opens on the portfolio tab, and shows the results once a call is done", async () => {
    const { result: vm } = setup();
    expect(vm.current.tab).toBe("portfolio");

    await act(() => vm.current.run("getPortfolio"));

    expect(vm.current.tab).toBe("results");
    act(() => vm.current.setTab("read"));
    expect(vm.current.tab).toBe("read");
  });

  it("cannot remove anything until some registration ids are given, once each", () => {
    const { result: vm } = setup();
    expect(vm.current.canRemove).toBe(false);

    act(() => vm.current.setRemoveIdsText("id-1\nid-2, id-1"));

    expect(vm.current.removeCount).toBe(2);
    expect(vm.current.canRemove).toBe(true);
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
    act(() => vm.current.fillRemoveIds());
    expect(vm.current.removeIdsText).toBe("");
  });

  it("sends the ids to remove, and the addresses to add, as lists", async () => {
    const { result: vm, onRun } = setup();
    act(() => vm.current.setRemoveIdsText("id-1 id-2"));
    act(() => vm.current.setAddAccountId(" base:0xabc "));
    act(() => vm.current.setAddAddressesText("0x1\n0x2"));

    await act(() => vm.current.run("removeRegistrations"));
    await act(() => vm.current.run("addAddresses"));

    expect(onRun).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ action: "removeRegistrations", registrationIds: ["id-1", "id-2"] }),
    );
    expect(onRun).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "addAddresses",
        addressAccountId: "base:0xabc",
        addresses: ["0x1", "0x2"],
      }),
    );
  });

  it("needs an account and at least one address to add addresses", () => {
    const { result: vm } = setup();
    act(() => vm.current.setAddAddressesText("0x1"));
    expect(vm.current.canAddAddresses).toBe(false);

    act(() => vm.current.setAddAccountId("base:0xabc"));
    expect(vm.current.canAddAddresses).toBe(true);
  });

  it("points at the step to do next, until the portfolio is created and filled", async () => {
    const { result: vm } = setup();
    expect(vm.current.nextStep).toBe("createPortfolio");

    await act(() => vm.current.run("createPortfolio"));
    expect(vm.current.nextStep).toBe("registerAccounts");

    await act(() => vm.current.run("registerAccounts"));
    expect(vm.current.nextStep).toBeUndefined();
    expect(vm.current.progress).toEqual({ created: true, registered: true });
  });

  it("keeps the portfolio and the currency read-only until asked to edit them", () => {
    const { result: vm } = setup();
    expect(vm.current.contextOpen).toBe(false);

    act(() => vm.current.setContextOpen(true));
    expect(vm.current.contextOpen).toBe(true);

    act(() => vm.current.setContextOpen(false));
    expect(vm.current.contextOpen).toBe(false);
  });

  it("keeps the fields open while there is no portfolio id, since nothing can run without one", () => {
    const { result: vm } = setup({ defaultPortfolioId: "" });
    expect(vm.current.contextOpen).toBe(true);

    act(() => vm.current.setContextOpen(false));
    expect(vm.current.contextOpen).toBe(true);

    act(() => vm.current.setPortfolioId("p1"));
    expect(vm.current.contextOpen).toBe(false);
  });

  it("sends the range of the balance history", async () => {
    const { result: vm, onRun } = setup();
    act(() => vm.current.setRange("week"));

    await act(() => vm.current.run("getBalanceHistory"));

    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({ action: "getBalanceHistory", range: "week" }),
    );
  });

  describe("searching a result", () => {
    function withBalance() {
      const onRun = jest.fn<Promise<AccountPortfolioResult>, [AccountPortfolioRequest]>(() =>
        Promise.resolve({ ...result(true), view: balanceView("ETH", "USDC", "DAI") }),
      );
      return {
        onRun,
        ...renderHook(() =>
          useAccountPortfolioViewModel({
            accounts: [],
            defaultPortfolioId: "p1",
            serviceUrl: "https://portfolio.test",
            onRun,
          }),
        ),
      };
    }

    it("narrows the result to the lines that match, and counts the others", async () => {
      const { result: vm } = withBalance();
      await act(() => vm.current.run("getBalance"));
      expect(vm.current.searchable).toBe(true);

      act(() => vm.current.setSearch("usdc"));

      expect(shownTickers(vm.current.resultView)).toEqual(["USDC"]);
      expect(vm.current.unmatchedCount).toBe(2);
    });

    it("starts every new call from an empty search", async () => {
      const { result: vm } = withBalance();
      await act(() => vm.current.run("getBalance"));
      act(() => vm.current.setSearch("usdc"));

      await act(() => vm.current.run("getBalance"));

      expect(vm.current.search).toBe("");
      expect(shownTickers(vm.current.resultView)).toHaveLength(3);
    });

    it("offers no search on a result that has no lines to search", async () => {
      const { result: vm } = setup();
      await act(() => vm.current.run("getPortfolio"));
      expect(vm.current.searchable).toBe(false);
    });
  });

  it("keeps the latest runs first and lets an older one be selected", async () => {
    const { result: vm } = setup();
    await act(() => vm.current.run("createPortfolio"));
    await act(() => vm.current.run("getPortfolio"));
    expect(vm.current.history.map(entry => entry.action)).toEqual([
      "getPortfolio",
      "createPortfolio",
    ]);

    act(() => vm.current.openRun(vm.current.history[1].id));
    expect(vm.current.selected?.action).toBe("createPortfolio");
  });

  it("shows a past call in the results tab, and forgets every call when cleared", async () => {
    const { result: vm } = setup();
    await act(() => vm.current.run("createPortfolio"));
    act(() => vm.current.setTab("history"));

    act(() => vm.current.openRun(vm.current.history[0].id));
    expect(vm.current.tab).toBe("results");

    act(() => vm.current.clearHistory());
    expect(vm.current.history).toHaveLength(0);
    expect(vm.current.selected).toBeUndefined();
  });
});
