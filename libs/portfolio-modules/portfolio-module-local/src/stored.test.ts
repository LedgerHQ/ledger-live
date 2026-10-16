import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createMemoryPortfolioStore } from "./store";
import {
  accountDataOf,
  loadAccountData,
  localAccountOf,
  requirePortfolio,
  toPortfolio,
  toPortfolioAccount,
  updateAccount,
} from "./stored";
import {
  aDescriptor,
  aFailedAccount,
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
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

describe("accountDataOf", () => {
  it("gives the account module the descriptor, state and history of the account", () => {
    const store = createMemoryPortfolioStore();

    expect(accountDataOf(store, aStoredAccount({ state }))).toEqual({
      descriptor: aDescriptor("key-account"),
      state,
      history: store.history("account"),
    });
  });

  it("gives nothing for an account not served locally", () => {
    expect(accountDataOf(createMemoryPortfolioStore(), aFailedAccount())).toBeUndefined();
  });
});

describe("loadAccountData", () => {
  const ref = { portfolioId: "portfolio", accountId: "account" };

  it("loads the account module data of a stored account", async () => {
    const store = createMemoryPortfolioStore();
    await store.put(aStoredPortfolio({ accounts: [aStoredAccount({ state })] }));

    expect(await loadAccountData(store, ref)).toEqual({
      descriptor: aDescriptor("key-account"),
      state,
      history: store.history("account"),
    });
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
    expect(localAccountOf(deps, aStoredAccount())).toEqual({
      network: bitcoin,
      data: accountDataOf(deps.store, aStoredAccount()),
    });
  });

  it("returns nothing for an account not served locally, or whose network is gone", () => {
    expect(localAccountOf(deps, aFailedAccount())).toBeUndefined();
    expect(localAccountOf(deps, aStoredAccount({ network: "litecoin" }))).toBeUndefined();
  });
});
