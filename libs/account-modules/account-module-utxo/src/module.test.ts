import {
  createMemoryHistoryStore,
  type AccountData,
  type AccountIntent,
  type AccountOperation,
} from "@ledgerhq/account-module-framework";
import { anOperation, testContext } from "@ledgerhq/account-module-framework/test-utils";
import { createUtxoAccountModule } from "./module";
import { UtxoAccountNotSyncedError, emptyState, versioned } from "./state";
import { addressAt, fakeChain, tx } from "./test/fakeChain";
import type { UtxoAccountOptions, UtxoAccountState, UtxoState } from "./types";

const context = testContext();
const descriptor = {
  currencyId: "bitcoin",
  derivationMode: "native_segwit",
  index: 0,
  key: "xpub",
  derivationPath: "84'/0'/0'",
};
const NOW = Date.parse("2026-01-01T00:00:00.000Z");

const utxo = (txid: string, fields: Partial<UtxoState> = {}): UtxoState => ({
  txid,
  vout: 0,
  value: "1000",
  address: addressAt(0, 0),
  height: 5,
  replaceable: false,
  ...fields,
});

const syncedState = (utxos: UtxoState[]): UtxoAccountState => ({
  ...emptyState(),
  syncedHeight: 100,
  addresses: [
    { address: addressAt(0, 0), chain: 0, index: 0 },
    { address: addressAt(0, 1), chain: 0, index: 1 },
    { address: addressAt(1, 0), chain: 1, index: 0 },
  ],
  utxos,
});

const account = (
  state?: UtxoAccountState,
  operations: AccountOperation[] = [],
): AccountData<UtxoAccountState> & { history: ReturnType<typeof createMemoryHistoryStore> } => ({
  descriptor,
  state: state ? versioned(state) : undefined,
  history: createMemoryHistoryStore(operations),
});

const intent = (
  fields: Partial<AccountIntent<UtxoAccountOptions>> = {},
): AccountIntent<UtxoAccountOptions> => ({
  intentType: "transaction",
  type: "send",
  recipient: "stranger",
  amount: 500n,
  asset: { type: "native" },
  ...fields,
});

const pendingSend = (hash: string, inputs: string[]) =>
  anOperation({
    id: `${hash}-OUT`,
    hash,
    type: "OUT",
    block: null,
    optimistic: true,
    details: { inputs },
  });

describe("reads", () => {
  it("knows nothing of an account never synced, but its first addresses", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const data = account();

    expect(await module.getBalances(context, data)).toEqual([]);
    expect(await module.getUTXOs(context, data)).toEqual([]);
    expect(await module.getAddresses(context, data)).toEqual([]);
    expect(await module.getStakes(context, data)).toEqual([]);
    expect(await module.getFreshAddress(context, data)).toEqual({
      address: "ADDR-0-0",
      derivationPath: "84'/0'/0'/0/0",
    });
    expect(await module.getChangeAddress(context, data)).toEqual({
      address: "ADDR-1-0",
      derivationPath: "84'/0'/0'/1/0",
    });
  });

  it("reads balances, outputs and addresses from the state", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const state = syncedState([
      utxo("a"),
      utxo("b", { address: addressAt(1, 0), value: "250", height: null, replaceable: true }),
      utxo("orphan", { address: "not-in-the-account" }),
    ]);
    const data = account(state);

    expect(await module.getBalances(context, data)).toEqual([
      { value: 1250n + 1000n, asset: { type: "native" } },
    ]);
    expect(await module.getUTXOs(context, data)).toEqual([
      {
        txid: "a",
        vout: 0,
        value: 1000n,
        address: "ADDR-0-0",
        derivationPath: "84'/0'/0'/0/0",
        height: 5,
        replaceable: false,
        change: false,
      },
      {
        txid: "b",
        vout: 0,
        value: 250n,
        address: "ADDR-1-0",
        derivationPath: "84'/0'/0'/1/0",
        height: null,
        replaceable: true,
        change: true,
      },
    ]);
    expect(await module.getUTXOs(context, data, u => u.change)).toHaveLength(1);
    expect(await module.getAddresses(context, data)).toContainEqual({
      address: "ADDR-1-0",
      derivationPath: "84'/0'/0'/1/0",
      used: true,
    });
    expect(await module.getFreshAddress(context, data)).toMatchObject({ address: "ADDR-0-2" });
    expect(await module.getChangeAddress(context, data)).toMatchObject({ address: "ADDR-1-1" });
  });

  it("lists operations from the history, pending ones apart", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const confirmed = anOperation({ id: "c", hash: "c" });
    const pending = anOperation({ id: "p", hash: "p", block: null, date: new Date(NOW + 1) });
    const data = account(syncedState([]), [confirmed, pending]);

    expect((await module.listOperations(context, data, { limit: 1 })).items).toEqual([pending]);
    expect(await module.getPendingOperations(context, data)).toEqual([pending]);
  });

  it("shows addresses unchanged when the coin module does not display them", async () => {
    const { api } = fakeChain();
    const { displayAddress: _display, ...withoutDisplay } = api;
    const module = createUtxoAccountModule(withoutDisplay, { receiveChain: 2, changeChain: 3 });

    expect(await module.getFreshAddress(context, account())).toEqual({
      address: addressAt(2, 0),
      derivationPath: "84'/0'/0'/2/0",
    });
  });
});

describe("write path", () => {
  it("lets the coin module select among confirmed outputs and unconfirmed change", async () => {
    const { api } = fakeChain();
    api.selectInputs.mockResolvedValue([{ txid: "change", vout: 0 }]);
    const module = createUtxoAccountModule(api);
    const state = syncedState([
      utxo("confirmed"),
      utxo("change", { address: addressAt(1, 0), height: null }),
      utxo("unconfirmed-receive", { height: null }),
      utxo("excluded"),
      utxo("reserved"),
    ]);
    const data = account(state, [pendingSend("in-flight", ["reserved-0"])]);

    await module.estimateFees(
      context,
      data,
      intent({ accountOptions: { excludedUtxos: [{ txid: "excluded", vout: 0 }], strategy: 2 } }),
      { customFeesParameters: { feesStrategy: "fast" } },
    );

    const selection = api.selectInputs.mock.calls[0]?.[1] as Parameters<
      typeof api.selectInputs
    >[1] & {
      candidates: Array<{ txid: string }>;
    };
    expect(selection.candidates.map(c => c.txid)).toEqual(["confirmed", "change"]);
    expect(selection).toMatchObject({
      strategy: 2,
      customFeesParameters: { feesStrategy: "fast" },
    });
    expect(api.estimateFees).toHaveBeenCalledWith(
      context,
      {
        intentType: "transaction",
        type: "send",
        recipient: "stranger",
        amount: 500n,
        asset: { type: "native" },
        sender: addressAt(0, 2),
        data: {
          type: "fake",
          derivationMode: "native_segwit",
          change: { address: addressAt(1, 1), path: "84'/0'/0'/1/1" },
          inputs: [
            {
              txid: "change",
              vout: 0,
              address: addressAt(1, 0),
              path: "84'/0'/0'/1/0",
              value: "1000",
              blockHeight: null,
            },
          ],
        },
      },
      { customFeesParameters: { feesStrategy: "fast" } },
    );
  });

  it("keeps the client's data and sender, and falls back to a generic data type", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([]));

    await module.estimateFees(context, data, intent({ sender: "mine", data: { type: "bitcoin" } }));
    expect(api.estimateFees.mock.calls[0]?.[1]).toMatchObject({
      sender: "mine",
      data: { type: "bitcoin", inputs: [] },
    });

    const { craftTransactionData: _data, ...withoutData } = api;
    await createUtxoAccountModule(withoutData).estimateFees(context, data, intent());
    expect(api.estimateFees.mock.calls[1]?.[1]).toMatchObject({ data: { type: "utxo" } });
  });

  it("refuses an output the coin module selected outside the candidates", async () => {
    const { api } = fakeChain();
    api.selectInputs.mockResolvedValue([{ txid: "invented", vout: 3 }]);
    const module = createUtxoAccountModule(api);

    await expect(module.estimateFees(context, account(syncedState([])), intent())).rejects.toThrow(
      "Selected output invented:3 is not a candidate",
    );
  });

  it("refuses to spend before the first sync", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);

    await expect(module.estimateFees(context, account(), intent())).rejects.toBeInstanceOf(
      UtxoAccountNotSyncedError,
    );
    await expect(module.estimateMaxSpendable(context, account(), intent())).rejects.toBeInstanceOf(
      UtxoAccountNotSyncedError,
    );
  });

  it("spends again what a replaced transaction spent, listing the pending ones it conflicts with", async () => {
    const original = tx("original", {
      block: null,
      inputs: [{ txid: "fund", vout: 1, address: addressAt(0, 1), value: "800", sequence: 0 }],
      outputs: [{ index: 0, address: "stranger", value: "700" }],
    });
    const { api } = fakeChain([original]);
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([]), [
      pendingSend("child", ["fund-1"]),
      pendingSend("original", ["fund-1"]),
      anOperation({ id: "confirmed", hash: "confirmed", details: { inputs: ["fund-1"] } }),
      anOperation({ id: "unknown-hash", hash: "", block: null, details: { inputs: ["fund-1"] } }),
      pendingSend("unrelated", ["other-0"]),
    ]);

    await module.validateIntent(
      context,
      data,
      intent({ accountOptions: { replaceTxId: "original" } }),
    );

    expect(api.selectInputs).not.toHaveBeenCalled();
    expect(api.validateIntent.mock.calls[0]?.[1]).toMatchObject({
      data: {
        inputs: [
          { txid: "fund", vout: 1, address: addressAt(0, 1), path: "84'/0'/0'/0/1", value: "800" },
        ],
        replacement: { txid: "original", conflictingTxIds: ["child"] },
      },
    });
  });

  it("refuses to replace a transaction spending outputs the account does not control", async () => {
    const foreign = tx("foreign", {
      inputs: [{ txid: "x", vout: 0, address: "stranger", value: "1" }],
    });
    const coinbase = tx("coinbase", { inputs: [{ vout: 0, value: "1" }] });
    const script = tx("script", { inputs: [{ txid: "y", vout: 2, value: "1" }] });
    const { api } = fakeChain([foreign, coinbase, script]);
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([]));

    await expect(
      module.estimateFees(context, data, intent({ accountOptions: { replaceTxId: "foreign" } })),
    ).rejects.toThrow("Input x:0 is not controlled by the account");
    await expect(
      module.estimateFees(context, data, intent({ accountOptions: { replaceTxId: "coinbase" } })),
    ).rejects.toThrow("Transaction coinbase spends no previous output");
    await expect(
      module.estimateFees(context, data, intent({ accountOptions: { replaceTxId: "script" } })),
    ).rejects.toThrow("Input y:2 is not controlled by the account");
  });

  it("validates against the balance of the state, with the fee parameters given", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const customFees = { value: 7n, parameters: { feePerByte: 3n } };

    await module.validateIntent(context, account(syncedState([utxo("a")])), intent(), {
      customFees,
    });

    expect(api.validateIntent).toHaveBeenCalledWith(
      context,
      expect.anything(),
      [{ value: 1000n, asset: { type: "native" } }],
      { customFees },
    );
    expect(api.selectInputs.mock.calls[0]?.[1]).toMatchObject({
      customFeesParameters: { feePerByte: 3n },
    });
  });

  it("sends the amount the coin module computed for send-max, or the spendable outputs net of the fee", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([utxo("a"), utxo("b", { height: null })]));

    api.estimateFees.mockResolvedValueOnce({ value: 10n, parameters: { amount: 900n } });
    expect(await module.estimateMaxSpendable(context, data, intent())).toBe(900n);
    expect(api.estimateFees.mock.calls[0]?.[1]).toMatchObject({ useAllAmount: true });

    expect(await module.estimateMaxSpendable(context, data, intent())).toBe(990n);

    api.estimateFees.mockResolvedValueOnce({ value: 5000n });
    expect(await module.estimateMaxSpendable(context, data, intent())).toBe(0n);
  });

  it("crafts with the completed intent and describes the operation it becomes", async () => {
    const { api } = fakeChain();
    api.craftTransaction.mockResolvedValueOnce({
      transaction: "unsigned",
      details: {
        inputs: ["a-0"],
        fee: 10n,
        amount: 500n,
        senders: [addressAt(0, 0)],
        recipients: ["stranger"],
        replaceable: true,
      },
    } as never);
    const module = createUtxoAccountModule(api, { now: () => NOW });
    const data = account(syncedState([utxo("a")]));
    const customFees = { value: 10n };

    const crafted = await module.craftTransaction(context, data, intent(), { customFees });

    expect(api.craftTransaction).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ amount: 500n }),
      {
        customFees,
      },
    );
    expect(crafted).toMatchObject({ transaction: "unsigned" });
    expect(crafted.operation).toEqual({
      id: "",
      hash: "",
      type: "OUT",
      value: 510n,
      fee: 10n,
      asset: { type: "native" },
      senders: ["ADDR-0-0"],
      recipients: ["STRANGER"],
      block: null,
      date: new Date(NOW),
      failed: false,
      optimistic: true,
      details: { inputs: ["a-0"], replaceable: true },
    });
  });

  it("describes the operation from the intent when the coin module gives no details", async () => {
    const { api } = fakeChain();
    api.craftTransaction.mockResolvedValueOnce({
      transaction: "unsigned",
      details: { inputs: [], fee: 1n, amount: 500n, senders: [], recipients: [] },
    } as never);
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([]));

    const withEmptyRecipients = await module.craftTransaction(context, data, intent());
    expect(withEmptyRecipients.operation).toMatchObject({ recipients: ["stranger"], value: 501n });

    const withoutDetails = await module.craftTransaction(context, data, intent());
    expect(withoutDetails.operation).toMatchObject({
      value: 500n,
      fee: 0n,
      senders: [],
      recipients: ["stranger"],
      details: { inputs: [], replaceable: false },
    });
  });

  it("combines with the coin module, then broadcasts and records the optimistic operation", async () => {
    const { api } = fakeChain();
    const module = createUtxoAccountModule(api);
    const data = account(syncedState([]));
    const crafted = await module.craftTransaction(context, data, intent());

    expect(await module.combine(context, data, crafted, ["sig"], { pubkey: "pk" })).toBe("signed");
    expect(api.combine).toHaveBeenCalledWith(context, "unsigned", ["sig"], { pubkey: "pk" });

    const operation = await module.broadcast(context, data, "signed", crafted);
    expect(api.broadcast).toHaveBeenCalledWith(context, "signed", undefined);
    expect(operation).toMatchObject({
      id: "broadcast-hash-OUT",
      hash: "broadcast-hash",
      optimistic: true,
    });
    expect(data.history.snapshot()).toEqual([operation]);
  });
});
