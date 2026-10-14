import type { AccountData, SyncEvent } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { syncPortfolio } from "./sync";
import {
  aFailedAccount,
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  someDeps,
  type FakeNetwork,
} from "./test-utils";
import type { StoredAccount } from "./types";

const stateAt = (height: number) => ({ version: 1, data: { height } });

const syncingTo = (height: number) =>
  async function* (_context: unknown, account: AccountData): AsyncIterable<SyncEvent> {
    await account.history.upsert([anOperation({ id: `op-${account.descriptor.key}` })]);
    yield { state: stateAt(height - 1), progress: {} };
    yield { state: stateAt(height), progress: { blockHeight: height } };
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
  it("syncs each account to completion through its account module and persists its state", async () => {
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
    expect(sync).toHaveBeenCalledWith(
      bitcoin.context,
      {
        descriptor: aStoredAccount({ id: "a" }).descriptor,
        state: undefined,
        history: deps.store.history("a"),
      },
      {},
    );
  });

  it("resumes an account from its persisted state", async () => {
    const { deps, sync } = await setUp([aStoredAccount({ state: stateAt(5) })]);
    sync.mockImplementation(syncingTo(10));

    await syncPortfolio(deps, "portfolio");

    expect(sync).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ state: stateAt(5) }),
      {},
    );
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
      { id: "ada", network: "cardano", status: "registration_failure" },
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
  });

  it("clears the error of an account once it syncs again", async () => {
    const { deps } = await setUp([aStoredAccount({ error: "explorer down" })]);

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
