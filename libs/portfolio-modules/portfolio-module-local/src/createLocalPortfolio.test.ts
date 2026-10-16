import type { AccountData, CraftedAccountTransaction } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { EXTENSION_METHODS } from "@ledgerhq/portfolio-module-framework";
import { createLocalPortfolio } from "./createLocalPortfolio";
import { createMemoryPortfolioStore } from "./store";
import { aLocalNetwork, type FakeNetwork } from "./test-utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const XPUB_ACCOUNT = "js:2:bitcoin:xpub:native_segwit";

const setUp = () => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const { accountModule } = bitcoin;
  accountModule.sync.mockImplementation(async function* (_context, account: AccountData) {
    await account.history.upsert([anOperation({ id: "received", hash: "tx-1", value: 50n })]);
    await account.state.put({ version: 1, data: { height: 1 } });
    yield { progress: {} };
  });
  accountModule.getBalances.mockResolvedValue({
    value: [{ asset: { type: "native" }, value: 50n }],
  });
  accountModule.craftTransaction.mockImplementation(
    async (): Promise<CraftedAccountTransaction> => ({
      transaction: "raw",
      operation: anOperation({ id: "sent", type: "OUT", hash: "", value: 20n }),
    }),
  );
  accountModule.combine.mockResolvedValue("signed");
  accountModule.broadcast.mockImplementation(async (_context, account, _signed, crafted) => {
    const operation = { ...crafted.operation, hash: "tx-2", optimistic: true };
    await account.history.upsert([operation]);
    return operation;
  });
  const api = createLocalPortfolio({ networks: { bitcoin }, store: createMemoryPortfolioStore() });
  return { api, bitcoin };
};

describe("createLocalPortfolio", () => {
  it("registers, syncs and reads an account through its account module", async () => {
    const { api } = setUp();
    await api.createPortfolio("portfolio");

    const registered = await api.addRegistrations("portfolio", [
      { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
    ]);
    const synced = await api.sync("portfolio");

    expect(registered.registrations?.[0]?.id).toMatch(UUID);
    expect(synced).toEqual([{ id: XPUB_ACCOUNT, network: "bitcoin", status: "synchronized" }]);
    expect((await api.getUpdates("portfolio")).items).toEqual([
      expect.objectContaining({ accountId: XPUB_ACCOUNT, txHash: "tx-1" }),
    ]);
    expect((await api.getPortfolioBalance("portfolio")).items).toEqual([
      expect.objectContaining({
        type: "success",
        items: [expect.objectContaining({ amount: "50" })],
      }),
    ]);
  });

  it("samples the balance history up to now", async () => {
    const { api } = setUp();
    await api.createPortfolio("portfolio");
    await api.addRegistrations("portfolio", [
      { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
    ]);
    const before = Date.now();

    const page = await api.getPortfolioBalanceHistory("portfolio", { order: "DESC", size: 1 });

    const latest = Date.parse(page.items?.[0]?.time ?? "");
    expect(latest).toBeGreaterThanOrEqual(before);
    expect(latest).toBeLessThanOrEqual(Date.now());
  });

  it("sends from an account through its account module, recording the operation", async () => {
    const { api } = setUp();
    await api.createPortfolio("portfolio");
    await api.addRegistrations("portfolio", [
      { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
    ]);
    const intent = { type: "send", sender: "xpub", recipient: "bc1", amount: "20" };

    const { rawTransaction } = await api.encodeTransaction("bitcoin", { intent });
    const { signedTransaction } = await api.combineTransaction("bitcoin", {
      rawTransaction,
      signature: "sig",
    });
    const { transactionId } = await api.broadcastTransaction("bitcoin", { signedTransaction });

    expect(transactionId).toBe("tx-2");
    expect((await api.getUpdates("portfolio")).items).toEqual([
      expect.objectContaining({ txHash: "tx-2" }),
    ]);
  });

  it("serves every extension", () => {
    const { api } = setUp();

    expect(EXTENSION_METHODS.filter(name => typeof api[name] !== "function")).toEqual([]);
  });

  it("serves the account reads of an account", async () => {
    const { api, bitcoin } = setUp();
    bitcoin.accountModule.getFreshAddress.mockResolvedValue({
      value: { address: "bc1fresh", derivationPath: "84'/0'/0'/0/0" },
    });
    await api.createPortfolio("portfolio");
    await api.addRegistrations("portfolio", [
      { type: "auto_derive", network: "bitcoin", xpub: "xpub" },
    ]);

    expect(await api.getFreshAddress("portfolio", XPUB_ACCOUNT)).toEqual({
      address: "bc1fresh",
      derivation_path: "84'/0'/0'/0/0",
    });
  });

  it("serves the network endpoints of the configured networks", async () => {
    const { api, bitcoin } = setUp();
    bitcoin.coinModule.validateAddress.mockResolvedValue(false);

    expect(await api.listNetworks()).toEqual(["bitcoin"]);
    expect(await api.validateAddress("bitcoin", "nope")).toEqual({ valid: false });
  });
});
