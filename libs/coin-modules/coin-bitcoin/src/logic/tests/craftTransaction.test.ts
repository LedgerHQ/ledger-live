import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { InvalidUtxoId, UnknownUtxo } from "../../errors";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { Psbt, Transaction, address as btcAddress } from "bitcoinjs-lib";
import { http, HttpResponse } from "msw";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { combine } from "../combine";
import { craftTransaction, RBF_SEQUENCE } from "../craftTransaction";
import { estimateFees } from "../estimateFees";
import { CURRENCY_ADDRESSES, PRISTINE_P2PKH } from "./helpers/fixtures";
import { ADDRESSES, PRIVATE_KEY, PUBLIC_KEY, fundingTransaction, signPsbt } from "./helpers/keys";
import {
  explorerUrl,
  feesHandler,
  networkHandler,
  pendingUtxosHandler,
  server,
  testContext,
  txHandler,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

const RECIPIENT_SCRIPT = Buffer.from(btcAddress.toOutputScript(PRISTINE_P2PKH));

/** Serves the funding transactions of `sender` as its UTXOs, with their raw hex. */
function fund(sender: string, values: number[]) {
  const script = Buffer.from(btcAddress.toOutputScript(sender));
  const txs = values.map((value, salt) => fundingTransaction(script, value, salt));
  server.use(
    utxosHandler(sender, [
      {
        data: txs.map((tx, i) => ({
          hash: tx.getId(),
          txId: tx.getId(),
          outputIndex: 0,
          value: String(values[i]),
          hex: script.toString("hex"),
          height: 900_000,
        })),
        token: null,
      },
    ]),
    pendingUtxosHandler(sender),
    ...txs.map(tx =>
      http.get(`${explorerUrl()}/tx/${tx.getId()}/hex`, () =>
        HttpResponse.json({ transaction_hash: tx.getId(), hex: tx.toHex() }),
      ),
    ),
  );
  return txs;
}

const intent = (sender: string, overrides: Partial<TransactionIntent> = {}): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender,
  recipient: PRISTINE_P2PKH,
  amount: 50_000n,
  asset: { type: "native" },
  senderPublicKey: PUBLIC_KEY.toString("hex"),
  ...overrides,
});

describe("craftTransaction", () => {
  beforeEach(() => server.use(feesHandler({ "2": 3000, "4": 2000, "6": 1000 }), networkHandler()));

  it.each([
    ["legacy", ADDRESSES.legacy, false],
    ["nested SegWit", ADDRESSES.segwit, false],
    ["native SegWit", ADDRESSES.nativeSegwit, false],
    ["Taproot", ADDRESSES.taproot, true],
  ] as const)(
    "crafts a %s transaction that a signer signs and combine completes",
    async (_label, sender, taproot) => {
      fund(sender, [80_000, 30_000]);
      const crafted = await craftTransaction(testContext(), "bitcoin", intent(sender));
      // The signer (bitcoinjs here, hw-app-btc with a Ledger app in production) returns either the whole signed
      // transaction (hw-app-btc `createPaymentTransaction`) or one signature per input (`signPsbt`).
      const { reference, signatures } = signPsbt(crafted.transaction, taproot);
      const uncompressed = Buffer.from(secp256k1.getPublicKey(PRIVATE_KEY, false)).toString("hex");

      expect(combine("bitcoin", crafted.transaction, [reference])).toBe(reference);
      expect(combine("bitcoin", crafted.transaction, signatures, uncompressed)).toBe(reference);
      expect(signatures).toHaveLength(Psbt.fromBase64(crafted.transaction).inputCount);
      expect(Transaction.fromHex(reference).ins).toHaveLength(
        Psbt.fromBase64(crafted.transaction).txInputs.length,
      );
    },
  );

  it("refuses a fully signed transaction that is not the crafted one", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
    );
    const other = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit, { amount: 40_000n }),
    );
    const { reference } = signPsbt(other.transaction);
    expect(() => combine("bitcoin", crafted.transaction, [reference])).toThrow(
      "the signed transaction is not the crafted transaction",
    );
  });

  it("pays the recipient, returns the change to the sender and pays the medium rate", async () => {
    const sender = ADDRESSES.nativeSegwit;
    fund(sender, [80_000]);
    const crafted = await craftTransaction(testContext(), "bitcoin", intent(sender));
    const psbt = Psbt.fromBase64(crafted.transaction);

    expect(psbt.txOutputs.map(o => [Buffer.from(o.script).toString("hex"), o.value])).toEqual([
      [RECIPIENT_SCRIPT.toString("hex"), 50_000n],
      [
        Buffer.from(btcAddress.toOutputScript(sender)).toString("hex"),
        80_000n - 50_000n - (crafted.details?.fee as bigint),
      ],
    ]);
    // 3, 2 and 1 sat/vB, raised to the relay floor + 1 and kept strictly decreasing: 4, 3, 2.
    expect(crafted.details?.feePerByte).toBe(3n);
    // As the bridge sends bitcoin transactions: replaceable (BIP 125), version 2 (app-bitcoin-new).
    expect(psbt.txInputs.map(input => input.sequence)).toEqual([RBF_SEQUENCE]);
    expect(psbt.version).toBe(2);
  });

  it("gives every input its previous transaction", async () => {
    const sender = ADDRESSES.nativeSegwit;
    const [funding] = fund(sender, [80_000]);
    const psbt = Psbt.fromBase64(
      (await craftTransaction(testContext(), "bitcoin", intent(sender))).transaction,
    );
    expect(Transaction.fromBuffer(psbt.data.inputs[0].nonWitnessUtxo!).getId()).toBe(
      funding.getId(),
    );
    expect(psbt.data.inputs[0].witnessUtxo?.value).toBe(80_000n);
  });

  it("sends everything without change for useAllAmount", async () => {
    const sender = ADDRESSES.nativeSegwit;
    fund(sender, [80_000, 30_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(sender, { useAllAmount: true, amount: 0n }),
    );
    const psbt = Psbt.fromBase64(crafted.transaction);
    expect(psbt.txInputs).toHaveLength(2);
    expect(psbt.txOutputs).toHaveLength(1);
    expect(psbt.txOutputs[0].value).toBe(110_000n - (crafted.details?.fee as bigint));
  });

  it("imposes the custom fee rate, or the custom absolute fee", async () => {
    const sender = ADDRESSES.nativeSegwit;
    fund(sender, [80_000]);
    const byRate = await craftTransaction(testContext(), "bitcoin", intent(sender), {
      value: 0n,
      parameters: { feePerByte: 7n },
    });
    expect(byRate.details?.feePerByte).toBe(7n);

    const fixed = await craftTransaction(testContext(), "bitcoin", intent(sender), {
      value: 4_321n,
    });
    expect(fixed.details?.fee).toBe(4_321n);
  });

  it("refuses an intent the outputs cannot cover", async () => {
    fund(ADDRESSES.nativeSegwit, [10_000]);
    await expect(
      craftTransaction(testContext(), "bitcoin", intent(ADDRESSES.nativeSegwit)),
    ).rejects.toBeInstanceOf(NotEnoughBalance);
  });

  it("crafts a fee below the relay minimum as given: validateIntent reports it", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        value: 10n,
        parameters: { feesStrategy: "custom" },
      },
    );
    expect(crafted.details?.fee).toBe(10n);
  });

  it("crafts with a custom rate", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        value: 0n,
        parameters: { feesStrategy: "custom", feePerByte: 3n },
      },
    );
    expect(crafted.details?.feePerByte).toBe(3n);
  });

  it("reads a zero customFees.value as no imposed fee, as coin-service sends it", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        value: 0n,
        parameters: { feesStrategy: "fast" },
      },
    );
    expect(crafted.details?.feePerByte).toBe(4n);
  });

  it.each([
    ["legacy", ADDRESSES.legacy, false],
    ["nested SegWit", ADDRESSES.segwit, false],
    ["native SegWit", ADDRESSES.nativeSegwit, false],
    ["Taproot", ADDRESSES.taproot, true],
  ] as const)(
    "prices a %s transaction for its real signed size",
    async (_label, sender, taproot) => {
      // Independent of the size maths: the fee is checked against the transaction once signed.
      for (const [values, amount] of [
        [[80_000], 50_000n],
        [[30_000, 30_000, 30_000], 80_000n],
      ] as const) {
        fund(sender, [...values]);
        const crafted = await craftTransaction(
          testContext(),
          "bitcoin",
          intent(sender, { amount }),
        );
        const signed = Transaction.fromHex(signPsbt(crafted.transaction, taproot).reference);
        const realSize = BigInt(signed.virtualSize());
        const pricedSize =
          (crafted.details?.fee as bigint) / (crafted.details?.feePerByte as bigint);
        // Never under the real size (the transaction must pay its rate), at most a few vbytes over
        // (signature lengths vary).
        expect(pricedSize).toBeGreaterThanOrEqual(realSize);
        expect(pricedSize - realSize).toBeLessThanOrEqual(3n);
      }
    },
  );

  it("crafts with a custom absolute fee", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        value: 2_500n,
        parameters: { feesStrategy: "custom" },
      },
    );
    expect(crafted.details?.fee).toBe(2_500n);
  });

  it("keeps the caller's absolute fee when the estimate's parameters come back with it", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    const estimation = await estimateFees(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        feesStrategy: "custom",
      },
    );
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      {
        value: 2_500n,
        parameters: { ...estimation.parameters, feesStrategy: "custom" },
      },
    );
    expect(crafted.details?.fee).toBe(2_500n);
  });

  it("crafts with an absolute fee without reading the explorer's rates", async () => {
    fund(ADDRESSES.nativeSegwit, [80_000]);
    // Only the relay floor is read: the rates endpoint is down.
    server.use(http.get(`${explorerUrl("btc")}/fees`, () => HttpResponse.error()));
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(ADDRESSES.nativeSegwit),
      { value: 2_500n },
    );
    expect(crafted.details?.fee).toBe(2_500n);
  });

  it("fetches each previous transaction once", async () => {
    const sender = ADDRESSES.nativeSegwit;
    const script = Buffer.from(btcAddress.toOutputScript(sender));
    const funding = fundingTransaction(script, 40_000);
    funding.addOutput(script, 40_000n);
    let fetches = 0;
    server.use(
      utxosHandler(sender, [
        {
          data: [0, 1].map(outputIndex => ({
            txId: funding.getId(),
            outputIndex,
            value: "40000",
            hex: script.toString("hex"),
          })),
          token: null,
        },
      ]),
      pendingUtxosHandler(sender),
      http.get(`${explorerUrl()}/tx/${funding.getId()}/hex`, () => {
        fetches++;
        return HttpResponse.json({ hex: funding.toHex() });
      }),
    );
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      intent(sender, { amount: 60_000n }),
    );
    expect(Psbt.fromBase64(crafted.transaction).txInputs).toHaveLength(2);
    expect(fetches).toBe(1);
  });

  it("crafts with the uncompressed public key a Ledger signer returns", async () => {
    const uncompressed = Buffer.from(secp256k1.getPublicKey(PRIVATE_KEY, false)).toString("hex");
    for (const sender of [ADDRESSES.legacy, ADDRESSES.segwit, ADDRESSES.nativeSegwit]) {
      fund(sender, [80_000]);
      const crafted = await craftTransaction(
        testContext(),
        "bitcoin",
        intent(sender, { senderPublicKey: uncompressed }),
      );
      const { reference } = signPsbt(crafted.transaction);
      expect(combine("bitcoin", crafted.transaction, [reference])).toBe(reference);
    }
  });

  it("cannot build a transaction to what is not an address, and asks nothing of the explorer", async () => {
    await expect(
      craftTransaction(
        testContext(),
        "bitcoin",
        intent(ADDRESSES.nativeSegwit, { recipient: "nope" }),
      ),
    ).rejects.toThrow("InvalidAddress");
  });

  it("requires the public key of a nested SegWit sender, and checks it", async () => {
    fund(ADDRESSES.segwit, [80_000]);
    await expect(
      craftTransaction(
        testContext(),
        "bitcoin",
        (({ senderPublicKey: _key, ...rest }) => rest)(intent(ADDRESSES.segwit)),
      ),
    ).rejects.toThrow("senderPublicKey is required");
    await expect(
      craftTransaction(
        testContext(),
        "bitcoin",
        intent(ADDRESSES.segwit, { senderPublicKey: "02" + "33".repeat(32) }),
      ),
    ).rejects.toThrow("senderPublicKey does not match the sender address");
  });

  it("refuses token and staking intents", async () => {
    await expect(
      craftTransaction(
        testContext(),
        "bitcoin",
        intent(ADDRESSES.nativeSegwit, { asset: { type: "token", assetReference: "x" } }),
      ),
    ).rejects.toThrow("only native transfers are supported");
  });
});

const inputsOf = (crafted: { details?: Record<string, unknown> }) =>
  (crafted.details?.inputs ?? []) as { hash: string; outputIndex: number }[];

describe("craftTransaction with a coin control", () => {
  const sender = ADDRESSES.nativeSegwit;
  const control = (utxoStrategy: Record<string, unknown>, overrides = {}) =>
    intent(sender, {
      data: { type: "unknown", utxoStrategy },
      ...overrides,
    } as Partial<TransactionIntent>);

  beforeEach(() => server.use(feesHandler({ "2": 3000, "4": 2000, "6": 1000 }), networkHandler()));

  it("never spends an excluded output, for a send or a send-max", async () => {
    const txs = fund(sender, [80_000, 60_000, 30_000]);
    const excluded = `${txs[0].getId()}:0`;
    const send = await craftTransaction(
      testContext(),
      "bitcoin",
      control({ excludedUtxos: [excluded] }, { amount: 20_000n }),
    );
    const sweep = await craftTransaction(
      testContext(),
      "bitcoin",
      control({ excludedUtxos: [excluded] }, { useAllAmount: true, amount: 0n }),
    );
    for (const crafted of [send, sweep]) {
      const ids = inputsOf(crafted).map(input => `${input.hash}:${input.outputIndex}`);
      expect(ids).not.toContain(excluded);
    }
    expect(inputsOf(sweep)).toHaveLength(2);
  });

  it("spends exactly the selected output, or refuses with NotEnoughBalance", async () => {
    const txs = fund(sender, [80_000, 60_000, 30_000]);
    const selectedUtxos = [`${txs[2].getId()}:0`];
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      control({ selectedUtxos }, { amount: 20_000n }),
    );
    expect(Psbt.fromBase64(crafted.transaction).txInputs).toHaveLength(1);
    expect(inputsOf(crafted).map(input => input.hash)).toEqual([txs[2].getId()]);

    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos })),
    ).rejects.toBeInstanceOf(NotEnoughBalance);
  });

  it("refuses a selected output the address does not hold, naming it", async () => {
    fund(sender, [80_000]);
    const unknown = `${"ef".repeat(32)}:0`;
    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos: [unknown] })),
    ).rejects.toEqual(expect.objectContaining({ name: "UnknownUtxo", utxoId: unknown }));
    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos: [unknown] })),
    ).rejects.toBeInstanceOf(UnknownUtxo);
  });

  it("refuses a selected output that is neither spendable nor spent by a pending transaction", async () => {
    const txs = fund(sender, [80_000]);
    const pendingId = `${"d".repeat(64)}:0`;
    server.use(
      pendingUtxosHandler(sender, {
        spent: [
          { hash: txs[0].getId(), txId: txs[0].getId(), outputIndex: 0, value: "80000", hex: "" },
        ],
      }),
    );
    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos: [pendingId] })),
    ).rejects.toEqual(expect.objectContaining({ name: "UnknownUtxo", utxoId: pendingId }));
  });

  it("refuses a malformed UTXO id", async () => {
    fund(sender, [80_000]);
    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos: ["nope"] })),
    ).rejects.toBeInstanceOf(InvalidUtxoId);
  });

  it("refuses an output listed twice, so no input is duplicated", async () => {
    const txs = fund(sender, [80_000]);
    const twice = `${txs[0].getId()}:0`;
    await expect(
      craftTransaction(testContext(), "bitcoin", control({ selectedUtxos: [twice, twice] })),
    ).rejects.toEqual(expect.objectContaining({ name: "InvalidUtxoId", utxoId: twice }));
  });

  it("selects the same inputs and fee for the estimate and the craft", async () => {
    const txs = fund(sender, [80_000, 60_000, 30_000]);
    const coinControl = control(
      {
        selectedUtxos: [`${txs[2].getId()}:0`],
        strategy: "merge-outputs",
      },
      { amount: 20_000n },
    );
    const estimation = await estimateFees(testContext(), "bitcoin", coinControl);
    const crafted = await craftTransaction(testContext(), "bitcoin", coinControl);
    expect(estimation.parameters?.inputCount).toBe(inputsOf(crafted).length);
    expect(estimation.value).toBe(crafted.details?.fee);
  });
});

describe("craftTransaction replacing an unconfirmed transaction", () => {
  const sender = ADDRESSES.nativeSegwit;
  const senderScript = Buffer.from(btcAddress.toOutputScript(sender));
  const replace = (overrides: Partial<TransactionIntent> = {}) =>
    intent(sender, {
      data: { type: "unknown", utxoStrategy: { selectedUtxos } },
      ...overrides,
    } as Partial<TransactionIntent>);
  let selectedUtxos: string[];

  // Confirmed output b (60_000) is free; a (80_000) is spent by pending transaction p, whose change
  // output p:1 (200_000) is the address's own unconfirmed output.
  beforeEach(() => {
    const [a] = fund(sender, [80_000, 60_000]);
    const aId = a.getId();
    const pending = "e".repeat(64);
    const spentA = { hash: aId, txId: aId, outputIndex: 0, value: "80000", hex: "" };
    selectedUtxos = [`${aId}:0`];
    server.use(
      feesHandler({ "2": 3000, "4": 2000, "6": 1000 }),
      networkHandler(),
      pendingUtxosHandler(sender, {
        spent: [spentA],
        created: [
          {
            hash: pending,
            txId: pending,
            outputIndex: 1,
            value: "200000",
            hex: senderScript.toString("hex"),
          },
        ],
      }),
      txHandler(pending, [`${aId}:0`]),
    );
  });

  it("speeds up: spends the original's input again, at the new rate, signalling RBF", async () => {
    const crafted = await craftTransaction(testContext(), "bitcoin", replace(), {
      value: 0n,
      parameters: { feePerByte: 9n },
    });
    expect(inputsOf(crafted).map(input => `${input.hash}:${input.outputIndex}`)).toEqual(
      selectedUtxos,
    );
    expect(crafted.details?.feePerByte).toBe(9n);
    expect(Psbt.fromBase64(crafted.transaction).txInputs.map(i => i.sequence)).toEqual([
      RBF_SEQUENCE,
    ]);
  });

  it("cancels: sends the whole input back to the sender in a single output", async () => {
    const crafted = await craftTransaction(
      testContext(),
      "bitcoin",
      replace({ recipient: sender, useAllAmount: true, amount: 0n }),
      { value: 0n, parameters: { feePerByte: 9n } },
    );
    const { txOutputs } = Psbt.fromBase64(crafted.transaction);
    expect(txOutputs).toHaveLength(1);
    expect(Buffer.from(txOutputs[0].script).toString("hex")).toBe(senderScript.toString("hex"));
    expect(inputsOf(crafted)).toHaveLength(1);
  });

  it("never spends what the replaced transaction creates, and adds no input", async () => {
    // 100_000 exceeds the selected input; the replaced transaction's 200_000 change and the free
    // 60_000 output would cover it, but neither is added.
    const request = replace({ amount: 100_000n });
    await expect(craftTransaction(testContext(), "bitcoin", request)).rejects.toBeInstanceOf(
      NotEnoughBalance,
    );
    const estimation = await estimateFees(testContext(), "bitcoin", request);
    expect(estimation.parameters).toEqual(
      expect.objectContaining({ inputCount: 1, sufficient: false }),
    );
  });

  it("refuses on a currency that does not signal RBF", async () => {
    const ltc = CURRENCY_ADDRESSES.litecoin;
    const spent = { txId: "a".repeat(64), hash: "a".repeat(64), outputIndex: 0, value: "80000" };
    server.use(
      utxosHandler(ltc, [{ data: [spent], token: null }], "ltc"),
      pendingUtxosHandler(ltc, { spent: [spent] }, "ltc"),
      feesHandler({ "2": 3000, "4": 2000, "6": 1000 }, "ltc"),
      networkHandler("0.00001", "ltc"),
    );
    const request = intent(ltc, {
      recipient: ltc,
      data: { type: "unknown", utxoStrategy: { selectedUtxos: [`${spent.hash}:0`] } },
    } as Partial<TransactionIntent>);
    await expect(
      craftTransaction(testContext({ explorerId: "ltc" }), "litecoin", request),
    ).rejects.toEqual(
      expect.objectContaining({ name: "ReplacementNotSupported", utxoIds: [`${spent.hash}:0`] }),
    );
  });
});
