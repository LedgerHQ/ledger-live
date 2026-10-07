import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { http, HttpResponse } from "msw";
import { combine } from "../combine";
import { craftTransaction, FINAL_SEQUENCE } from "../craftTransaction";
import { estimateFees } from "../estimateFees";
import { cryptoFor } from "../selectUtxos";
import { type SigningRequest, serializeOutputs } from "../signingRequest";
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

  it("crafts a signing request with the device parameters the bridge uses", async () => {
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

  it("combines the request with the transaction the device built", async () => {
    serve(c.explorerId, c.sender, [80_000_000]);
    const crafted = await craftTransaction(context, c.currencyId, intent);
    const { outputScriptHex } = JSON.parse(crafted.transaction) as SigningRequest;
    const signed = `0400008085202f8901${"ab".repeat(70)}${outputScriptHex}00000000`.toUpperCase();

    expect(combine(c.currencyId, crafted.transaction, [signed])).toBe(signed.toLowerCase());
    expect(() => combine(c.currencyId, crafted.transaction, ["00".repeat(80)])).toThrow(
      "the signed transaction does not pay the crafted outputs",
    );
    // The request comes back from the consumer: its outputs are re-serialized, never trusted.
    const request = JSON.parse(crafted.transaction) as SigningRequest;
    expect(() =>
      combine(c.currencyId, JSON.stringify({ ...request, outputScriptHex: "" }), [signed]),
    ).toThrow("the signing request's outputScriptHex does not serialize its outputs");
    expect(() =>
      combine(c.currencyId, JSON.stringify({ ...request, outputs: [] }), [signed]),
    ).toThrow("malformed signing request");
    // An odd-nibble text match is not a byte match.
    expect(() => combine(c.currencyId, crafted.transaction, [`0${outputScriptHex}0`])).toThrow(
      "the signed transaction does not pay the crafted outputs",
    );
    expect(() => combine(c.currencyId, crafted.transaction, [signed, signed])).toThrow(
      "expected one signed transaction, got 2 value(s)",
    );
  });
});
