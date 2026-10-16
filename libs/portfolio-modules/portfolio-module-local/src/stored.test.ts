import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createMemoryPortfolioStore } from "./store";
import {
  accountDataOf,
  loadAccountData,
  localAccountOf,
  requirePortfolio,
  stateStoreOf,
  toPortfolio,
  toPortfolioAccount,
  updateAccount,
} from "./stored";
import {
  aFailedAccount,
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  anAccountData,
} from "./test-utils";

const state = { version: 1, data: "synced" };

describe("requirePortfolio", () => {
  it("returns the stored portfolio", async () => {
    const store = createMemoryPortfolioStore();
    await store.put(aStoredPortfolio());

    expect(await requirePortfolio(store, "portfolio")).toEqual(aStoredPortfolio());
  });

  it("rejects an unknown portfolio as not found", async () => {
    await expect(requirePortfolio(createMemoryPortfolioStore(), "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});

describe("updateAccount", () => {
  it("updates the latest stored version of one account", async () => {
    const store = createMemoryPortfolioStore();
    const other = aStoredAccount({ id: "other" });
    await store.put(aStoredPortfolio({ accounts: [aStoredAccount(), other] }));

    const updated = await updateAccount(store, "portfolio", "account", account => ({
      ...account,
      status: "uninitialized",
    }));

    const expected = aStoredPortfolio({
      accounts: [aStoredAccount({ status: "uninitialized" }), other],
    });
    expect(updated).toEqual(expected);
    expect(await store.get("portfolio")).toEqual(expected);
  });
});

describe("toPortfolioAccount", () => {
  it("tells why the account failed: the failure recorded, else its message", () => {
    const failure = { name: "UnexpectedGetBalanceError", message: "", status: 405 };

    expect(toPortfolioAccount(aStoredAccount({ error: "", failure }))).toEqual({
      id: "account",
      network: "bitcoin",
      status: "synchronized",
      error: failure,
    });
    expect(toPortfolioAccount(aFailedAccount())).toEqual({
      id: "account",
      network: "bitcoin",
      status: "registration_failure",
      error: { name: "Error", message: "not served" },
    });
  });

  it("tells no error for an account that has none", () => {
    expect(toPortfolioAccount(aStoredAccount())).not.toHaveProperty("error");
    expect(toPortfolioAccount(aStoredAccount({ error: "" }))).not.toHaveProperty("error");
  });
});

describe("toPortfolio", () => {
  it("exposes the registrations and the account statuses", () => {
    expect(toPortfolio(aStoredPortfolio())).toEqual({
      id: "portfolio",
      registrations: aStoredPortfolio().registrations,
      accounts: [{ id: "account", network: "bitcoin", status: "synchronized" }],
    });
  });
});

describe("stateStoreOf", () => {
  it("reads the state of the latest stored version of the account", async () => {
    const store = createMemoryPortfolioStore();
    const states = stateStoreOf(store, "portfolio", "account");
    await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));

    expect(await states.get()).toEqual(state);
  });

  it("reads no state for an account never synced, gone, or whose portfolio is gone", async () => {
    const store = createMemoryPortfolioStore();
    const states = stateStoreOf(store, "portfolio", "account");
    expect(await states.get()).toBeUndefined();

    await store.put(aStoredPortfolio({ accounts: [] }));
    expect(await states.get()).toBeUndefined();

    await store.put(aStoredPortfolio());
    expect(await states.get()).toBeUndefined();
  });

  it("writes the state into the latest stored version of the account, keeping the rest", async () => {
    const store = createMemoryPortfolioStore();
    const other = aStoredAccount({ id: "other", state });
    await store.put(
      aStoredPortfolio({ accounts: [aStoredAccount({ status: "uninitialized" }), other] }),
    );
    const next = { version: 2, data: "refreshed" };

    await stateStoreOf(store, "portfolio", "account").put(next);

    expect(await store.get("portfolio")).toEqual(
      aStoredPortfolio({
        accounts: [aStoredAccount({ status: "uninitialized", state: next }), other],
      }),
    );
  });
});

describe("accountDataOf", () => {
  it("gives the account module the descriptor, history and state store of the account", async () => {
    const store = createMemoryPortfolioStore();
    await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));

    const data = accountDataOf(store, "portfolio", aStoredAccount());

    expect(data).toEqual(anAccountData(store));
    expect(await data?.state.get()).toEqual(state);
  });

  it("gives nothing for an account not served locally", () => {
    expect(
      accountDataOf(createMemoryPortfolioStore(), "portfolio", aFailedAccount()),
    ).toBeUndefined();
  });
});

describe("loadAccountData", () => {
  const ref = { portfolioId: "portfolio", accountId: "account" };

  it("loads the account module data of a stored account", async () => {
    const store = createMemoryPortfolioStore();
    await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));

    const data = await loadAccountData(store, ref);

    expect(data).toEqual(anAccountData(store));
    expect(await data?.state.get()).toEqual(state);
  });

  it("loads nothing once the account, or its portfolio, is gone", async () => {
    const store = createMemoryPortfolioStore();
    expect(await loadAccountData(store, ref)).toBeUndefined();

    await store.put(aStoredPortfolio({ accounts: [] }));
    expect(await loadAccountData(store, ref)).toBeUndefined();
  });
});

describe("localAccountOf", () => {
  const bitcoin = aLocalNetwork();
  const deps = { networks: { bitcoin }, store: createMemoryPortfolioStore() };

  it("returns the network and account module data of an account served locally", () => {
    expect(localAccountOf(deps, "portfolio", aStoredAccount())).toEqual({
      network: bitcoin,
      data: anAccountData(deps.store),
    });
  });

  it("returns nothing for an account not served locally, or whose network is gone", () => {
    expect(localAccountOf(deps, "portfolio", aFailedAccount())).toBeUndefined();
    expect(
      localAccountOf(deps, "portfolio", aStoredAccount({ network: "litecoin" })),
    ).toBeUndefined();
  });
});
