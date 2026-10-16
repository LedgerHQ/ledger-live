import type { AccountData, SyncEvent } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { syncPortfolio } from "./sync";
import {
  aFailedAccount,
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  anAccountData,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { StoredAccount } from "./types";

const stateAt = (height: number) => ({ version: 1, data: { height } });

const syncingTo = (height: number) =>
  async function* (_context: unknown, account: AccountData): AsyncIterable<SyncEvent> {
    await account.history.upsert([anOperation({ id: `op-${account.descriptor.key}` })]);
    await account.state.put(stateAt(height - 1));
    yield { progress: {} };
    await account.state.put(stateAt(height));
    yield { progress: { blockHeight: height } };
  };

const setUp = async (accounts: StoredAccount[]) => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const deps = someDeps({ networks: { bitcoin } });
  await deps.store.put(aStoredPortfolio({ accounts }));
  return { deps, bitcoin, sync: bitcoin.accountModule.sync };
};

const storedAccounts = async ({ store }: ReturnType<typeof someDeps>) =>
  (await store.get("portfolio"))?.accounts;

describe("syncPortfolio", () => {
  it("syncs each account to completion through its account module, which persists its state", async () => {
    const { deps, bitcoin, sync } = await setUp([
      aStoredAccount({ id: "a", status: "uninitialized" }),
      aStoredAccount({ id: "b", status: "uninitialized" }),
    ]);
    sync.mockImplementation(syncingTo(10));

    const accounts = await syncPortfolio(deps, "portfolio");

    expect(accounts).toEqual([
      { id: "a", network: "bitcoin", status: "synchronized" },
      { id: "b", network: "bitcoin", status: "synchronized" },
    ]);
    expect(await storedAccounts(deps)).toEqual([
      aStoredAccount({ id: "a", state: stateAt(10) }),
      aStoredAccount({ id: "b", state: stateAt(10) }),
    ]);
    expect((await deps.store.history("b").list()).items).toEqual([anOperation({ id: "op-key-b" })]);
    expect(sync).toHaveBeenCalledWith(bitcoin.context, anAccountData(deps.store, "a"), {});
  });

  it("resumes an account from its persisted state", async () => {
    const { deps, sync } = await setUp([aStoredAccount({ state: stateAt(5) })]);
    const resumedFrom: unknown[] = [];
    sync.mockImplementation(async function* (context, account: AccountData) {
      resumedFrom.push(await account.state.get());
      yield* syncingTo(10)(context, account);
    });

    await syncPortfolio(deps, "portfolio");

    expect(resumedFrom).toEqual([stateAt(5)]);
    expect(await storedAccounts(deps)).toEqual([aStoredAccount({ state: stateAt(10) })]);
  });

  it("keeps the last state the module put before it failed", async () => {
    const { deps, sync } = await setUp([aStoredAccount({ state: stateAt(5) })]);
    sync.mockImplementation(async function* (_context, account: AccountData) {
      await account.state.put(stateAt(7));
      yield { progress: {} };
      throw new Error("explorer down");
    });

    await syncPortfolio(deps, "portfolio");

    expect(await storedAccounts(deps)).toEqual([
      aStoredAccount({
        state: stateAt(7),
        error: "explorer down",
        failure: { name: "Error", message: "explorer down" },
      }),
    ]);
  });

  it("marks an account synchronized even when its sync yields no state", async () => {
    const { deps } = await setUp([aStoredAccount({ status: "uninitialized" })]);

    await syncPortfolio(deps, "portfolio");

    expect(await storedAccounts(deps)).toEqual([aStoredAccount()]);
  });

  it("skips the accounts not served locally", async () => {
    const { deps, sync } = await setUp([
      aFailedAccount({ id: "ada", network: "cardano" }),
      aStoredAccount({ id: "litecoin", network: "litecoin" }),
    ]);

    expect(await syncPortfolio(deps, "portfolio")).toEqual([
      {
        id: "ada",
        network: "cardano",
        status: "registration_failure",
        error: { name: "Error", message: "not served" },
      },
      { id: "litecoin", network: "litecoin", status: "synchronized" },
    ]);
    expect(sync).not.toHaveBeenCalled();
  });

  it("records a failure and goes on with the other accounts", async () => {
    const { deps, sync } = await setUp([
      aStoredAccount({ id: "never-synced", status: "uninitialized" }),
      aStoredAccount({ id: "synced-before" }),
      aStoredAccount({ id: "healthy", status: "uninitialized" }),
    ]);
    sync
      .mockImplementationOnce(() => {
        throw new Error("explorer down");
      })
      .mockImplementationOnce(() => {
        throw "timeout";
      })
      .mockImplementation(syncingTo(10));

    const accounts = await syncPortfolio(deps, "portfolio");

    expect(accounts.map(({ id, status }) => [id, status])).toEqual([
      ["never-synced", "registration_failure"],
      ["synced-before", "synchronized"],
      ["healthy", "synchronized"],
    ]);
    expect((await storedAccounts(deps))?.map(({ error }) => error)).toEqual([
      "explorer down",
      "timeout",
      undefined,
    ]);
    expect((await storedAccounts(deps))?.map(({ failure }) => failure)).toEqual([
      { name: "Error", message: "explorer down" },
      { name: "Error", message: "timeout" },
      undefined,
    ]);
  });

  it("records a failure in JSON form, its fields and cause included", async () => {
    const { deps, sync } = await setUp([aStoredAccount()]);
    const cause = Object.assign(new Error("Method Not Allowed"), { status: 405 });
    const failure = Object.assign(new Error("", { cause }), {
      name: "UnexpectedGetBalanceError",
      config: { headers: { authorization: "secret" } },
    });
    sync.mockImplementation(() => {
      throw failure;
    });

    await syncPortfolio(deps, "portfolio");

    expect((await storedAccounts(deps))?.[0]).toEqual(
      aStoredAccount({
        error: "",
        failure: {
          name: "UnexpectedGetBalanceError",
          message: "",
          cause: { name: "Error", message: "Method Not Allowed", status: 405 },
        },
      }),
    );
  });

  it("clears the error of an account once it syncs again", async () => {
    const { deps } = await setUp([
      aStoredAccount({ error: "explorer down", failure: { name: "Error", message: "down" } }),
    ]);

    await syncPortfolio(deps, "portfolio");

    expect(await storedAccounts(deps)).toEqual([aStoredAccount()]);
  });

  it("stops on abort, passing the signal to the account module", async () => {
    const { deps, sync } = await setUp([aStoredAccount({ status: "uninitialized" })]);
    const controller = new AbortController();
    sync.mockImplementation(() => {
      controller.abort();
      throw new Error("aborted");
    });

    await expect(syncPortfolio(deps, "portfolio", { signal: controller.signal })).rejects.toThrow(
      "aborted",
    );
    expect(sync).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      signal: controller.signal,
    });
    expect(await storedAccounts(deps)).toEqual([aStoredAccount({ status: "uninitialized" })]);
  });

  it("syncs no further account once aborted, even if an account module ignores the signal", async () => {
    const { deps, sync } = await setUp([aStoredAccount({ id: "a" }), aStoredAccount({ id: "b" })]);
    const controller = new AbortController();
    sync.mockImplementation(async function* () {
      controller.abort(new Error("aborted"));
    });

    await expect(syncPortfolio(deps, "portfolio", { signal: controller.signal })).rejects.toThrow(
      "aborted",
    );
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown portfolio as not found", async () => {
    await expect(syncPortfolio(someDeps(), "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});
