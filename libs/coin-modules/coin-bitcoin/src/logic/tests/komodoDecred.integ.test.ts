import network from "@ledgerhq/live-network";
import { createApi } from "../../api";
import { bitcoinDefaults, type BitcoinContext } from "../../config";
import type { ExplorerTx } from "../../network/types";

const context: BitcoinContext = {
  config: async currencyId => bitcoinDefaults[currencyId as keyof typeof bitcoinDefaults],
  logger: () => {},
};

/**
 * Komodo and Decred through the coin module API, on the live explorer: the formats the Ledger app
 * builds itself (see `craftTransaction.signingRequest.integ.test.ts` for crafting). Nothing real is
 * ever broadcast: every transaction sent is one the node already has, or garbage.
 */
describe.each([
  {
    currencyId: "komodo",
    // An address with a short, settled history (2017).
    address: "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi",
    // A confirmed Sapling (v4) transaction.
    confirmedTx: "0820ff9a7d53ae87f900b14b8e286832463f403dddd5c5a8cda5be0a733c010c",
    alreadyKnown: "transaction already in block chain",
    garbage: "TX decode failed",
  },
  {
    currencyId: "decred",
    address: "DsVETTBzJSuzszSTiJLmrswY47GcCKCRu5E",
    confirmedTx: "2bcc5ae9d0561b2130b68bea696e834ec89e5e1a4ad1f65a57e8f3d6d583d732",
    alreadyKnown: "transaction already exists",
    garbage: "unsupported transaction type",
  },
] as const)("$currencyId (live explorer)", c => {
  const { explorer, explorerId } = bitcoinDefaults[c.currencyId];
  const api = createApi(c.currencyId);

  it("reads the chain tip and its block info", async () => {
    const tip = await api.lastBlock(context);
    expect(tip.height).toBeGreaterThan(0);
    const info = await api.getBlockInfo(context, tip.height);
    expect(info).toEqual(expect.objectContaining({ height: tip.height, hash: tip.hash }));
  });

  it("reads the confirmed balance of an address", async () => {
    const [balance] = await api.getBalance(context, c.address);
    expect(balance.asset).toEqual({ type: "native" });
    expect(typeof balance.value).toBe("bigint");
    expect(balance.value).toBeGreaterThanOrEqual(0n);
  });

  it("lists one operation per confirmed transaction of an address", async () => {
    // Parity with the bridge's mapping: __tests__/integ/coinModuleApi.listOperations.parity.integ.test.ts.
    const { items } = await api.listOperations(context, c.address, { minHeight: 0 });
    const { data } = await network<{ data: ExplorerTx[] }>({
      url: `${explorer.url}/blockchain/v4/${explorerId}/address/${c.address}/txs?batch_size=50`,
    });
    const confirmed = data.data.filter(tx => tx.block).map(tx => tx.hash);
    expect(items.length).toBeGreaterThan(0);
    expect(items.map(operation => operation.tx.hash).sort()).toEqual([...confirmed].sort());
  });

  it("broadcasts in the format the node decodes: it recognizes a transaction it already has", async () => {
    const { data } = await network<{ hex: string }>({
      url: `${explorer.url}/blockchain/v4/${explorerId}/tx/${c.confirmedTx}/hex`,
    });
    await expect(api.broadcast(context, data.hex)).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      message: expect.stringContaining(c.alreadyKnown),
    });
  });

  it("throws the node's rejection of garbage", async () => {
    await expect(api.broadcast(context, "deadbeef")).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      message: expect.stringContaining(c.garbage),
    });
  });
});

describe("getBlock (live explorer)", () => {
  it("lists the transactions of a Komodo block", async () => {
    const api = createApi("komodo");
    const tip = await api.lastBlock(context);
    const block = await api.getBlock(context, tip.height - 10);
    expect(block.info.height).toBe(tip.height - 10);
    expect(block.transactions.length).toBeGreaterThan(0);
  });

  // The Decred explorer cannot serve the transactions of a block that holds stake transactions
  // (votes, tickets: in practice every block) and answers 500. The module surfaces that error rather
  // than a partial block. To lift when the explorer serves them.
  it("surfaces the explorer's failure on a Decred block instead of a partial block", async () => {
    const api = createApi("decred");
    const tip = await api.lastBlock(context);
    await expect(api.getBlock(context, tip.height - 10)).rejects.toMatchObject({
      name: "LedgerAPI5xx",
    });
  });
});
