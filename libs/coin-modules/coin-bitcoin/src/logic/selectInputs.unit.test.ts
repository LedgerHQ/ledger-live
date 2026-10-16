import { CoinSelect } from "@ledgerhq/wallet-btc/pickingstrategies/CoinSelect";
import { Custom } from "@ledgerhq/wallet-btc/pickingstrategies/Custom";
import { DeepFirst } from "@ledgerhq/wallet-btc/pickingstrategies/DeepFirst";
import { Merge } from "@ledgerhq/wallet-btc/pickingstrategies/Merge";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import { cryptoFor } from "./currency";
import type { BitcoinIntent } from "./intent";
import { selectInputs } from "./selectInputs";
import { BITCOIN_PICKING_STRATEGY, type BitcoinTxData, type BitcoinUtxoCandidate } from "./types";

const crypto = cryptoFor("bitcoin");
const logger = jest.fn();

const intent = (overrides: Partial<BitcoinIntent> = {}, data: Partial<BitcoinTxData> = {}) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: BTC_CHANGE,
    recipient: BTC_RECIPIENT,
    amount: 40_000n,
    asset: { type: "native" },
    ...overrides,
    data: { type: "bitcoin", derivationMode: "native_segwit", feePerByte: "2", ...data },
  }) as BitcoinIntent;

const candidate = (
  txid: string,
  value: number,
  overrides: Partial<BitcoinUtxoCandidate> = {},
): BitcoinUtxoCandidate => ({
  txid,
  vout: 0,
  value: String(value),
  address: BTC_CHANGE,
  height: 10,
  replaceable: false,
  ...overrides,
});

const select = (
  request: Partial<Parameters<typeof selectInputs>[2]> & { candidates: BitcoinUtxoCandidate[] },
) => selectInputs(fakeExplorer(), "bitcoin", { intent: intent(), ...request }, logger);

const spies = () => ({
  deepFirst: jest.spyOn(DeepFirst.prototype, "selectFromUtxos"),
  coinSelect: jest.spyOn(CoinSelect.prototype, "selectFromUtxos"),
  merge: jest.spyOn(Merge.prototype, "selectFromUtxos"),
});

afterEach(() => jest.restoreAllMocks());

describe("selectInputs", () => {
  it("takes the oldest outputs first by default, returned in the candidates' order", async () => {
    const picked = await select({
      candidates: [
        candidate("recent", 30_000, { height: 30 }),
        candidate("old", 30_000, { height: 5 }),
        candidate("older", 30_000, { height: 1 }),
      ],
    });
    expect(picked).toEqual([
      { txid: "old", vout: 0 },
      { txid: "older", vout: 0 },
    ]);
  });

  it("takes the smallest outputs first when merging", async () => {
    const picked = await select({
      candidates: [
        candidate("big", 100_000, { height: 1 }),
        candidate("small", 25_000, { height: 9, vout: 1 }),
        candidate("smaller", 20_000, { height: 9, vout: 2 }),
      ],
      strategy: BITCOIN_PICKING_STRATEGY.MERGE_OUTPUTS,
    });
    expect(picked).toEqual([
      { txid: "small", vout: 1 },
      { txid: "smaller", vout: 2 },
    ]);
  });

  it.each([
    [undefined, DeepFirst],
    [BITCOIN_PICKING_STRATEGY.DEEP_OUTPUTS_FIRST, DeepFirst],
    [BITCOIN_PICKING_STRATEGY.OPTIMIZE_SIZE, CoinSelect],
    [BITCOIN_PICKING_STRATEGY.MERGE_OUTPUTS, Merge],
    [BITCOIN_PICKING_STRATEGY.CUSTOM, Custom],
  ])("picks with strategy %p as wallet-btc's %p", async (strategy, Strategy) => {
    const { deepFirst, coinSelect, merge } = spies();
    await select({ candidates: [candidate("a", 100_000)], strategy });
    const [used] = [deepFirst, coinSelect, merge].flatMap(spy => spy.mock.contexts);
    expect(used).toBeInstanceOf(Strategy);
    expect(used.constructor).toBe(Strategy);
  });

  it.each([9, "0", null])("refuses the unknown strategy %p", async strategy => {
    await expect(select({ candidates: [], strategy })).rejects.toThrow(
      "Unsupported Bitcoin UTXO picking strategy",
    );
  });

  it("hands the strategy the logger, the candidates, the outputs, the fee rate and the derivation mode", async () => {
    const { deepFirst } = spies();
    await select({
      intent: intent({}, { opReturnData: "deadbeef" }),
      candidates: [candidate("a", 100_000, { vout: 3, height: null, replaceable: true })],
    });

    const [log, utxos, outputs, feePerByte] = deepFirst.mock.calls[0];
    expect(log).toBe(logger);
    expect(utxos).toEqual([
      {
        value: "100000",
        address: BTC_CHANGE,
        output_hash: "a",
        output_index: 3,
        block_height: null,
        rbf: true,
      },
    ]);
    expect(outputs.map(o => [o.script.toString("hex"), o.value.toFixed(), o.address])).toEqual([
      [crypto.toOpReturnOutputScript(Buffer.from("deadbeef", "hex")).toString("hex"), "0", null],
      [crypto.toOutputScript(BTC_RECIPIENT).toString("hex"), "40000", BTC_RECIPIENT],
    ]);
    expect(feePerByte).toBe(2);
    expect((deepFirst.mock.contexts[0] as DeepFirst).derivationMode).toBe("Native SegWit");
  });

  it("selects at the rate of the fee strategy when the intent has no custom one", async () => {
    const { deepFirst } = spies();
    await select({
      intent: { ...intent(), data: { type: "bitcoin" } },
      candidates: [candidate("a", 100_000)],
      customFeesParameters: { feesStrategy: "fast" },
    });
    expect(deepFirst.mock.calls[0][3]).toBe(20);
    expect((deepFirst.mock.contexts[0] as DeepFirst).derivationMode).toBe("Legacy");
  });

  it("selects nothing while the recipient is not valid", async () => {
    const { deepFirst } = spies();
    expect(
      await select({ intent: intent({ recipient: "bc1q" }), candidates: [candidate("a", 1e6)] }),
    ).toEqual([]);
    expect(deepFirst).not.toHaveBeenCalled();
  });

  it("selects nothing when the candidates cannot fund the intent", async () => {
    expect(await select({ candidates: [candidate("a", 30_000)] })).toEqual([]);
  });

  it("lets any other selection failure through", async () => {
    jest.spyOn(DeepFirst.prototype, "selectFromUtxos").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    await expect(select({ candidates: [candidate("a", 100_000)] })).rejects.toThrow("boom");
  });

  it("spends every candidate worth more than its own input on send-max", async () => {
    const inputCost =
      2 *
      (maxTxVBytesCeil(1, [], false, crypto, "Native SegWit") -
        maxTxVBytesCeil(0, [], false, crypto, "Native SegWit"));
    const picked = await select({
      intent: intent({ useAllAmount: true, amount: 0n, recipient: "" }),
      candidates: [
        candidate("worth", inputCost + 1),
        candidate("break-even", inputCost, { vout: 1 }),
        candidate("pending", 50_000, { vout: 2, height: null }),
      ],
    });
    expect(picked).toEqual([
      { txid: "worth", vout: 0 },
      { txid: "pending", vout: 2 },
    ]);
  });
});
