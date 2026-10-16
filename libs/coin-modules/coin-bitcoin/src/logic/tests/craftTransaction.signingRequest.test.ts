import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { http, HttpResponse } from "msw";
import { combine } from "../combine";
import { craftTransaction, FINAL_SEQUENCE } from "../craftTransaction";
import { estimateFees } from "../estimateFees";
import { cryptoFor } from "../selectUtxos";
import type { SigningRequest } from "../signingRequest";
import { serializeOutputs } from "../signingRequest";
import {
  explorerUrl,
  feesHandler,
  networkHandler,
  pendingUtxosHandler,
  server,
  testContext,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

const CASES = [
  {
    currencyId: "komodo",
    explorerId: "kmd",
    sender: "RNjJYvz6aCMaeZanXfCpXvoc2FKxEKMTj2",
    recipient: "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi",
    additionals: ["komodo", "sapling"],
    hasExtraData: true,
    interestLockTime: true,
  },
  {
    currencyId: "decred",
    explorerId: "dcr",
    sender: "DsVETTBzJSuzszSTiJLmrswY47GcCKCRu5E",
    recipient: "DshusByvZ2y4HuUaqkb7LrNTQTrqCjLnBW7",
    additionals: ["decred"],
    hasExtraData: false,
    interestLockTime: false,
  },
] as const;

// A previous transaction is only carried, not parsed, for these formats: any hex stands for it.
const prevTxHex = (salt: string) => `0400008085202f89${salt.repeat(8)}`;

function serve(explorerId: string, sender: string, values: number[]) {
  const script = cryptoFor(explorerId === "kmd" ? "komodo" : "decred").toOutputScript(sender);
  const utxos = values.map((value, i) => ({
    txId: String(i + 1).repeat(64),
    outputIndex: i,
    value: String(value),
    hex: script.toString("hex"),
    type: "pubkeyhash",
  }));
  server.use(
    feesHandler({ "2": 32_000, "4": 31_000, "6": 30_000 }, explorerId),
    networkHandler("0.0001", explorerId),
    utxosHandler(sender, [{ data: utxos, token: null }], explorerId),
    pendingUtxosHandler(sender, {}, explorerId),
    ...utxos.map((utxo, i) =>
      http.get(`${explorerUrl(explorerId)}/tx/${utxo.txId}/hex`, () =>
        HttpResponse.json({ transaction_hash: utxo.txId, hex: prevTxHex(String(i)) }),
      ),
    ),
  );
  return { script, utxos };
}

const uint32 = (value: number): Buffer => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
};

/**
 * The transaction hw-app-btc's `createPaymentTransaction` returns for a request, in the request's
 * format (`serializeTransaction` and its final assembly), with each part overridable to tamper with.
 */
function builtByHwAppBtc(
  request: SigningRequest,
  {
    outputs = request.outputScriptHex,
    scriptSig = "47".padEnd(144, "ab"),
    vout = request.inputs[0].vout,
    tree = 0,
  } = {},
): string {
  const decred = request.additionals.includes("decred");
  const inputs = request.inputs.map(input =>
    Buffer.concat([
      Buffer.from(input.txid, "hex").reverse(),
      uint32(vout),
      decred
        ? Buffer.from([tree])
        : Buffer.concat([Buffer.from([scriptSig.length / 2]), Buffer.from(scriptSig, "hex")]),
      uint32(input.sequence),
    ]),
  );
  const witness = decred
    ? Buffer.concat([
        Buffer.from([request.inputs.length]),
        ...request.inputs.map(() =>
          Buffer.concat([
            Buffer.alloc(8),
            Buffer.alloc(4),
            Buffer.from("ffffffff", "hex"),
            Buffer.from([scriptSig.length / 2]),
            Buffer.from(scriptSig, "hex"),
          ]),
        ),
      ])
    : Buffer.alloc(11);
  return Buffer.concat([
    Buffer.from(decred ? "01000000" : "0400008085202f89", "hex"),
    Buffer.from([request.inputs.length]),
    ...inputs,
    Buffer.from(outputs, "hex"),
    uint32(request.lockTime ?? 0),
    Buffer.from(request.expiryHeight ?? "00000000", "hex"),
    witness,
  ]).toString("hex");
}

describe.each(CASES)("craftTransaction and combine for $currencyId", c => {
  const context = testContext({ explorerId: c.explorerId });
  const intent: TransactionIntent = {
    intentType: "transaction",
    type: "send",
    sender: c.sender,
    recipient: c.recipient,
    amount: 50_000_000n,
    asset: { type: "native" },
  };

  it("crafts a signing request with the createPaymentTransaction parameters the bridge uses", async () => {
    const { script, utxos } = serve(c.explorerId, c.sender, [80_000_000, 30_000_000]);
    const before = Math.floor(Date.now() / 1000);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    const request = JSON.parse(crafted.transaction) as SigningRequest;

    const recipientScript = cryptoFor(c.currencyId).toOutputScript(c.recipient);
    const change = 80_000_000n - 50_000_000n - (crafted.details?.fee as bigint);
    expect(request).toEqual(
      expect.objectContaining({
        type: "bitcoin-signing-request",
        version: 1,
        currencyId: c.currencyId,
        inputs: [
          {
            txid: utxos[0].txId,
            vout: 0,
            value: "80000000",
            prevTxHex: prevTxHex("0"),
            sequence: FINAL_SEQUENCE,
          },
        ],
        outputs: [
          { script: recipientScript.toString("hex"), value: "50000000" },
          { script: script.toString("hex"), value: change.toString() },
        ],
        outputScriptHex: serializeOutputs(
          [
            { script: recipientScript, value: 50_000_000n },
            { script, value: change },
          ],
          [...c.additionals],
        ),
        changeOutputIndex: 1,
        expiryHeight: "00000000",
        sigHashType: 1,
        segwit: false,
        additionals: [...c.additionals],
        hasExtraData: c.hasExtraData,
      }),
    );
    // Komodo claims its interest with a locktime 777 s before signing; Decred has none.
    expect("lockTime" in request).toBe(c.interestLockTime);
    expect(request.lockTime ?? before - 777).toBeGreaterThanOrEqual(before - 777);
  });

  it("prices the transaction the request describes", async () => {
    serve(c.explorerId, c.sender, [80_000_000, 30_000_000]);
    const estimation = await estimateFees(context, c.currencyId, intent);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    expect(estimation.value).toBeGreaterThan(0n);
    expect(crafted.details?.fee).toBe(estimation.value);
  });

  it("combines the request with the transaction hw-app-btc built", async () => {
    serve(c.explorerId, c.sender, [80_000_000]);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    const request = JSON.parse(crafted.transaction) as SigningRequest;
    const { outputScriptHex } = request;
    const signed = builtByHwAppBtc(request).toUpperCase();

    expect(combine(c.currencyId, crafted.transaction, [signed])).toBe(signed.toLowerCase());
    expect(() => combine(c.currencyId, crafted.transaction, ["00".repeat(80)])).toThrow(
      "the signed transaction is not the crafted transaction",
    );
    // The request comes back from the consumer: its outputs are re-serialized, never trusted.
    expect(() =>
      combine(c.currencyId, JSON.stringify({ ...request, outputScriptHex: "" }), [signed]),
    ).toThrow("the signing request's outputScriptHex does not serialize its outputs");
    expect(() =>
      combine(c.currencyId, JSON.stringify({ ...request, outputs: [] }), [signed]),
    ).toThrow("malformed signing request");
    // The crafted outputs alone, or shifted by a nibble, are not a transaction of the format.
    expect(() => combine(c.currencyId, crafted.transaction, [`0${outputScriptHex}0`])).toThrow(
      "the signed transaction is not the crafted transaction",
    );
    expect(() => combine(c.currencyId, crafted.transaction, [signed, signed])).toThrow(
      "expected one signed transaction, got 2 value(s)",
    );
  });

  it.each([[[80_000_000]], [[30_000_000, 30_000_000]]])(
    "prices at least the size of the transaction hw-app-btc builds (outputs %j)",
    async values => {
      serve(c.explorerId, c.sender, values);
      const estimation = await estimateFees(context, c.currencyId, intent);
      const crafted = await craftTransaction(context, c.currencyId, intent);
      const request = JSON.parse(crafted.transaction) as SigningRequest;
      // A P2PKH scriptSig at its largest for a Ledger signer (low-S: a 71-byte DER signature and its
      // sighash byte) and a 33-byte public key, with their pushes.
      const scriptSig = `48${"ab".repeat(72)}21${"cd".repeat(33)}`;
      const built = builtByHwAppBtc(request, { scriptSig }).length / 2;
      expect(request.inputs).toHaveLength(values.length);
      expect(estimation.parameters?.vsize).toBeGreaterThanOrEqual(BigInt(built));
    },
  );

  it("reads the outputs where the format puts them, not anywhere in the transaction", async () => {
    serve(c.explorerId, c.sender, [80_000_000]);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    const request = JSON.parse(crafted.transaction) as SigningRequest;
    // Pays someone else, with the crafted outputs as the payload of an OP_RETURN output.
    const payload = Buffer.from(request.outputScriptHex, "hex");
    const opReturn = Buffer.concat([Buffer.from([0x6a, 0x4c, payload.length]), payload]);
    const attacker = serializeOutputs(
      [
        { script: cryptoFor(c.currencyId).toOutputScript(c.sender), value: 79_000_000n },
        { script: opReturn, value: 0n },
      ],
      [...c.additionals],
    );
    expect(() =>
      combine(c.currencyId, crafted.transaction, [builtByHwAppBtc(request, { outputs: attacker })]),
    ).toThrow("the signed transaction does not pay the crafted outputs");
  });

  it("refuses a transaction that spends other inputs, or leaves an input unsigned", async () => {
    serve(c.explorerId, c.sender, [80_000_000]);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    const request = JSON.parse(crafted.transaction) as SigningRequest;
    expect(() =>
      combine(c.currencyId, crafted.transaction, [builtByHwAppBtc(request, { vout: 7 })]),
    ).toThrow("the signed transaction is not the crafted transaction");
    expect(() =>
      combine(c.currencyId, crafted.transaction, [builtByHwAppBtc(request, { scriptSig: "" })]),
    ).toThrow("the transaction is not signed");
  });

  if (c.currencyId === "decred") {
    it("refuses an input in the stake tree: the same txid and vout, another outpoint", async () => {
      serve(c.explorerId, c.sender, [80_000_000]);
      const crafted = await craftTransaction(context, c.currencyId, intent);
      const request = JSON.parse(crafted.transaction) as SigningRequest;
      expect(() =>
        combine(c.currencyId, crafted.transaction, [builtByHwAppBtc(request, { tree: 1 })]),
      ).toThrow("the signed transaction is not the crafted transaction");
    });
  }
});
