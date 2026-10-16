import { Transaction } from "bitcoinjs-lib";
import { BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import { broadcast } from "./broadcast";
import { combine, SignedTransactionMismatch } from "./combine";
import { cryptoFor } from "./currency";
import type { BitcoinSigningEnvelope } from "./types";

const crypto = cryptoFor("bitcoin");
const script = crypto.toOutputScript(BTC_RECIPIENT);
const PREV = "11".repeat(32);

function signedTx(value = 90_000): Transaction {
  const tx = new Transaction();
  tx.addInput(Buffer.from(PREV, "hex").reverse(), 1, 0);
  tx.addOutput(script, BigInt(value));
  return tx;
}

const envelope = (value = "90000"): BitcoinSigningEnvelope => ({
  version: 1,
  currency: "bitcoin",
  inputs: [
    {
      prevTxHex: "00",
      txid: PREV,
      outputIndex: 1,
      sequence: 0,
      path: "84'/0'/0'/0/0",
      blockHeight: 1,
    },
  ],
  outputs: [{ script: script.toString("hex"), value, address: BTC_RECIPIENT, isChange: false }],
  outputScriptHex: "",
  sigHashType: 1,
  segwit: true,
  additionals: ["bitcoin", "bech32"],
  hasExtraData: false,
  blockHeight: 1,
});

describe("combine", () => {
  it("returns the signed transaction when it matches the envelope", () => {
    const hex = signedTx().toHex();
    expect(combine(JSON.stringify(envelope()), [hex])).toBe(hex);
  });

  it("refuses a signed transaction paying something else", () => {
    expect(() => combine(JSON.stringify(envelope("1")), [signedTx().toHex()])).toThrow(
      SignedTransactionMismatch,
    );
  });

  it("expects exactly one signed transaction", () => {
    expect(() => combine(JSON.stringify(envelope()), [])).toThrow(/one signed transaction/);
  });

  it("leaves unchecked a format bitcoinjs cannot read", () => {
    expect(combine(JSON.stringify(envelope()), ["zz"])).toBe("zz");
  });
});

describe("broadcast", () => {
  it("submits the transaction with its source", async () => {
    const explorer = fakeExplorer({ spentAtHeight: { [PREV]: { 1: null } } });
    const hex = signedTx().toHex();
    const hash = await broadcast(explorer, hex, {
      mevProtected: false,
      source: { type: "live-app", name: "app" },
    });
    expect(hash).toBe("broadcast-txid");
    expect(explorer.broadcasted).toEqual([{ tx: hex, source: { type: "live-app", name: "app" } }]);
  });

  it("refuses to spend an output already confirmed-spent", async () => {
    const explorer = fakeExplorer({ spentAtHeight: { [PREV]: { 1: 799_000 } } });
    await expect(broadcast(explorer, signedTx().toHex())).rejects.toThrow("utxos already spent");
    expect(explorer.broadcasted).toEqual([]);
  });

  it("refuses when an input's transaction cannot be found", async () => {
    const explorer = fakeExplorer();
    (explorer.getUtxoTx as jest.Mock).mockRejectedValue(new Error("404"));
    await expect(broadcast(explorer, signedTx().toHex())).rejects.toThrow("tx not found");
  });
});
