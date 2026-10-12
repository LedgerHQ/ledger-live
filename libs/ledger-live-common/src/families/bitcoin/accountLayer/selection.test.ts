import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { BitcoinTxData } from "@ledgerhq/coin-bitcoin/api";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { bitcoinPickingStrategy, type BitcoinAccount, type BitcoinOutput } from "../types";
import { cryptoFor } from "./derivation";
import { emptyAccountState } from "./state";
import {
  completeIntent,
  computeIntentType,
  getNextChangeAddress,
  getOwnDisplayAddresses,
} from "./selection";

jest.mock("@ledgerhq/wallet-btc/pickingstrategies/Merge", () => {
  const actual = jest.requireActual("@ledgerhq/wallet-btc/pickingstrategies/Merge");
  return { Merge: jest.fn((...args) => new actual.Merge(...args)) };
});
import { Merge } from "@ledgerhq/wallet-btc/pickingstrategies/Merge";

const XPUB =
  "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC";
const RECIPIENT = "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";
const crypto = cryptoFor("bitcoin");
const address = (chain: number, index: number) =>
  crypto.getAddress("Native SegWit", XPUB, chain, index);

type Intent = TransactionIntent<any, BitcoinTxData>;

const utxo = (hash: string, value: number, addr: string, overrides: Partial<BitcoinOutput> = {}) =>
  ({
    hash,
    outputIndex: 0,
    blockHeight: 10,
    address: addr,
    value: new BigNumber(value),
    rbf: false,
    isChange: false,
    ...overrides,
  }) as BitcoinOutput;

async function account(overrides: Partial<BitcoinAccount> = {}): Promise<BitcoinAccount> {
  const [r0, r1, c0] = await Promise.all([address(0, 0), address(0, 1), address(1, 0)]);
  return {
    id: `js:2:bitcoin:${XPUB}:native_segwit`,
    currency: getCryptoCurrencyById("bitcoin"),
    derivationMode: "native_segwit",
    freshAddress: await address(0, 2),
    freshAddressPath: "84'/0'/0'/0/2",
    pendingOperations: [],
    operations: [],
    bitcoinResources: {
      utxos: [
        utxo("a", 30_000, r0),
        utxo("b", 50_000, r1),
        utxo("c", 20_000, c0, { isChange: true, blockHeight: null }),
        utxo("pending-receive", 99_000, r1, { blockHeight: null }),
      ],
      accountState: {
        ...emptyAccountState(),
        addresses: [
          { address: r0, chain: 0, index: 0 },
          { address: r1, chain: 0, index: 1 },
          { address: c0, chain: 1, index: 0 },
        ],
      },
    },
    ...overrides,
  } as unknown as BitcoinAccount;
}

const intent = (overrides: Partial<Intent> = {}): Intent => ({
  intentType: "transaction",
  type: "send",
  sender: "",
  recipient: RECIPIENT,
  amount: 40_000n,
  asset: { type: "native" },
  data: { type: "bitcoin" },
  ...overrides,
});

const estimateFees = jest.fn(async () => ({ value: 0n, parameters: { feePerByte: 2n } }));
const deps = { api: { estimateFees } as never, context: {} as never };
const tx = (familySpecificData: Record<string, unknown> = {}, feesStrategy = "medium") =>
  ({ family: "bitcoin", feesStrategy, familySpecificData }) as Record<string, unknown>;

beforeEach(() => jest.clearAllMocks());

describe("completeIntent", () => {
  it("adds the next change, the derivation mode and the selected inputs with their paths", async () => {
    const result = await completeIntent(
      intent({ recipient: RECIPIENT.toUpperCase() }),
      await account(),
      tx(),
      deps,
    );
    expect(result.recipient).toBe(RECIPIENT);
    expect(result.data).toMatchObject({
      type: "bitcoin",
      derivationMode: "Native SegWit",
      change: { address: await address(1, 1), path: "84'/0'/0'/1/1" },
    });
    // DeepFirst takes the oldest first: a then b (c is change, taken last by height order)
    expect(result.data?.inputs?.map(i => [i.txid, i.path, i.value])).toEqual([
      ["a", "84'/0'/0'/0/0", "30000"],
      ["b", "84'/0'/0'/0/1", "50000"],
    ]);
    expect(estimateFees).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ recipient: RECIPIENT }),
      { customFeesParameters: { feesStrategy: "medium" } },
    );
  });

  it("uses the custom rate without asking the network", async () => {
    await completeIntent(
      intent({ data: { type: "bitcoin", feePerByte: "3" } }),
      await account(),
      tx({}, "custom"),
      deps,
    );
    expect(estimateFees).not.toHaveBeenCalled();
  });

  it("asks the network with no strategy for a transaction without one", async () => {
    estimateFees.mockResolvedValueOnce({ value: 0n, parameters: {} } as never);
    await completeIntent(
      intent(),
      await account(),
      { family: "bitcoin", feesStrategy: null },
      deps,
    );
    expect(estimateFees).toHaveBeenCalledWith({}, expect.anything(), {
      customFeesParameters: { feesStrategy: undefined },
    });
  });

  it("leaves out excluded, committed and pending non-change UTXOs", async () => {
    const result = await completeIntent(
      intent({ amount: 15_000n }),
      await account({
        pendingOperations: [{ hash: "p", extra: { inputs: ["b-0"] } }] as never,
      }),
      tx({
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [{ hash: "a", outputIndex: 0 }],
        },
      }),
      deps,
    );
    expect(Merge).toHaveBeenCalled();
    expect(result.data?.inputs?.map(i => i.txid)).toEqual(["c"]);
    expect(result.data?.inputs?.[0]).toMatchObject({ path: "84'/0'/0'/1/0", blockHeight: null });
  });

  it("selects nothing when the coins do not cover the amount", async () => {
    const result = await completeIntent(
      intent({ amount: 10_000_000n }),
      await account(),
      tx(),
      deps,
    );
    expect(result.data?.inputs).toEqual([]);
  });

  it("selects nothing while the recipient is being typed", async () => {
    const result = await completeIntent(intent({ recipient: "bc1q" }), await account(), tx(), deps);
    expect(result.data?.inputs).toEqual([]);
  });

  it("takes every coin worth spending for send-max", async () => {
    const acc = await account();
    acc.bitcoinResources.utxos.push(utxo("dust", 10, await address(0, 0)));
    const result = await completeIntent(intent({ useAllAmount: true }), acc, tx(), deps);
    expect(result.data?.inputs?.map(i => i.txid).sort()).toEqual(["a", "b", "c"]);
  });

  it("accounts for the OP_RETURN output in the selection", async () => {
    const result = await completeIntent(
      intent({ data: { type: "bitcoin", opReturnData: "00ff" } }),
      await account(),
      tx(),
      deps,
    );
    expect(result.data).toMatchObject({ opReturnData: "00ff" });
    expect(result.data?.inputs?.length).toBeGreaterThan(0);
  });

  it("refuses an unknown picking strategy", async () => {
    await expect(
      completeIntent(
        intent(),
        await account(),
        tx({ utxoStrategy: { strategy: 9, excludeUTXOs: [] } }),
        deps,
      ),
    ).rejects.toThrow("Unsupported Bitcoin UTXO picking strategy");
  });

  it("lets an unexpected selection error through", async () => {
    (Merge as unknown as jest.Mock).mockImplementationOnce(() => ({
      selectFromUtxos: () => {
        throw new Error("boom");
      },
    }));
    await expect(
      completeIntent(
        intent(),
        await account(),
        tx({ utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] } }),
        deps,
      ),
    ).rejects.toThrow("boom");
  });

  it("refuses a change address that is not the account's next one", async () => {
    await expect(
      completeIntent(intent(), await account(), tx({ changeAddress: "bc1qwrong" }), deps),
    ).rejects.toThrow("Invalid change address");
  });

  it("needs a synced account", async () => {
    await expect(
      completeIntent(
        intent(),
        await account({ bitcoinResources: { utxos: [] } } as never),
        tx(),
        deps,
      ),
    ).rejects.toThrow("AccountNeedResync");
  });

  describe("replacement", () => {
    it("spends the replaced transaction's inputs, and names the pending ones it conflicts with", async () => {
      const r0 = await address(0, 0);
      estimateFees.mockResolvedValueOnce({
        value: 0n,
        parameters: { replacedInputs: [{ txid: "a", vout: 0, value: 30_000n, address: r0 }] },
      } as never);
      const acc = await account({
        pendingOperations: [
          { hash: "orig", extra: { inputs: ["a-0"] } },
          { hash: "other", extra: { inputs: ["a-0"] } },
          { hash: "", extra: { inputs: ["a-0"] } },
          { hash: "unrelated", extra: {} },
        ] as never,
        operations: [
          { hash: "synced-pending", blockHeight: undefined, extra: { inputs: ["a-0"] } },
          { hash: "confirmed", blockHeight: 5, extra: { inputs: ["a-0"] } },
        ] as never,
      });
      const result = await completeIntent(intent(), acc, tx({ replaceTxId: "orig" }), deps);
      expect(estimateFees).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          data: expect.objectContaining({ replacement: { txid: "orig" } }),
        }),
      );
      expect(result.data?.inputs).toEqual([
        { txid: "a", vout: 0, address: r0, path: "84'/0'/0'/0/0", value: "30000" },
      ]);
      expect(result.data?.replacement).toEqual({
        txid: "orig",
        conflictingTxIds: ["other", "synced-pending"],
      });
    });

    it("refuses inputs the account does not control", async () => {
      estimateFees.mockResolvedValueOnce({
        value: 0n,
        parameters: { replacedInputs: [{ txid: "z", vout: 1, value: 1n, address: null }] },
      } as never);
      await expect(
        completeIntent(intent(), await account(), tx({ replaceTxId: "orig" }), deps),
      ).rejects.toThrow("Input z:1 is not controlled by the account ()");
    });

    it("has no input to spend again when the estimation describes none", async () => {
      estimateFees.mockResolvedValueOnce({ value: 0n } as never);
      const result = await completeIntent(
        intent(),
        await account(),
        tx({ replaceTxId: "orig" }),
        deps,
      );
      expect(result.data?.inputs).toEqual([]);
    });
  });
});

describe("computeIntentType", () => {
  it("tells a send, a speed up and a cancel", () => {
    expect(computeIntentType(tx())).toBe("send");
    expect(computeIntentType({ ...tx({ replaceTxId: "t" }), recipient: RECIPIENT })).toBe(
      "replace-speedup",
    );
    expect(
      computeIntentType({
        ...tx({ replaceTxId: "t", changeAddress: "bc1qchange" }),
        recipient: "bc1qchange",
      }),
    ).toBe("replace-cancel");
    expect(computeIntentType({ family: "bitcoin" })).toBe("send");
  });
});

describe("account helpers", () => {
  it("gives the next change address, from index 0 on a fresh account", async () => {
    const fresh = await account();
    fresh.bitcoinResources.accountState = emptyAccountState();
    expect(await getNextChangeAddress(fresh)).toEqual({
      address: await address(1, 0),
      path: "84'/0'/0'/1/0",
    });
  });

  it("lists the account addresses as shown", async () => {
    expect(getOwnDisplayAddresses(await account()).size).toBe(3);
  });
});
