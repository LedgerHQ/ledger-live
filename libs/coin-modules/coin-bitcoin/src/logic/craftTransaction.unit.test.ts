import { Transaction } from "bitcoinjs-lib";
import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import {
  craftTransaction,
  parseEnvelope,
  serializeOutputs,
  type CraftedDetails,
} from "./craftTransaction";
import type { BitcoinIntent } from "./intent";
import { cryptoFor } from "./currency";

const crypto = cryptoFor("bitcoin");

/** A previous transaction paying 100 000 sats to `address`, as the explorer serves it. */
function prevTx(address: string): { txid: string; hex: string } {
  const tx = new Transaction();
  tx.addInput(Buffer.alloc(32, 1), 0);
  tx.addOutput(crypto.toOutputScript(address), 100_000n);
  return { txid: tx.getId(), hex: tx.toHex() };
}

const intent = (overrides: Partial<BitcoinIntent> = {}, txid = "aa".repeat(32)): BitcoinIntent => ({
  intentType: "transaction",
  type: "send",
  sender: BTC_CHANGE,
  recipient: BTC_RECIPIENT,
  amount: 50_000n,
  asset: { type: "native" },
  data: {
    type: "bitcoin",
    derivationMode: "Native SegWit",
    inputs: [
      {
        txid,
        vout: 0,
        value: "100000",
        address: BTC_CHANGE,
        path: "84'/0'/0'/0/3",
        blockHeight: 10,
      },
    ],
    change: { address: BTC_CHANGE, path: "84'/0'/0'/1/7" },
  },
  ...overrides,
});

describe("serializeOutputs", () => {
  it("writes the count, then value, script length and script of each output", () => {
    const script = crypto.toOutputScript(BTC_RECIPIENT);
    const hex = serializeOutputs(
      [{ script, value: 0x1_0000_0001n, address: null, isChange: false }],
      false,
    );
    const buf = Buffer.from(hex, "hex");
    expect(buf[0]).toBe(1);
    expect(buf.readUInt32LE(1)).toBe(1);
    expect(buf.readUInt32LE(5)).toBe(1);
    expect(buf[9]).toBe(script.length);
    expect(buf.subarray(10).equals(script)).toBe(true);
  });

  it("adds Decred's two varints after each value", () => {
    const script = crypto.toOutputScript(BTC_RECIPIENT);
    const plain = serializeOutputs([{ script, value: 1n, address: null, isChange: false }], false);
    const decred = serializeOutputs([{ script, value: 1n, address: null, isChange: false }], true);
    expect(decred.length / 2).toBe(plain.length / 2 + 2);
  });
});

describe("craftTransaction", () => {
  it("returns the device signing request for the selected inputs", async () => {
    const { txid, hex } = prevTx(BTC_CHANGE);
    const explorer = fakeExplorer({ txHex: { [txid]: hex } });

    const crafted = await craftTransaction(explorer, "bitcoin", intent({}, txid), {
      value: 0n,
      parameters: { feePerByte: "10" },
    });
    const envelope = parseEnvelope(crafted.transaction);

    expect(envelope).toMatchObject({
      version: 1,
      currency: "bitcoin",
      segwit: true,
      additionals: ["bitcoin", "bech32"],
      hasExtraData: false,
      changePath: "84'/0'/0'/1/7",
      blockHeight: 800_000,
    });
    expect(envelope.inputs).toEqual([
      { prevTxHex: hex, txid, outputIndex: 0, sequence: 0, path: "84'/0'/0'/0/3", blockHeight: 10 },
    ]);
    expect(envelope.outputs.map(o => o.isChange)).toEqual([false, true]);

    const details = crafted.details as CraftedDetails;
    expect(details.inputs).toEqual([`${txid}-0`]);
    expect(details.recipients).toEqual([BTC_RECIPIENT]);
    expect(details.senders).toEqual([BTC_CHANGE]);
    expect(details.replaceable).toBe(true);
  });

  it("reads a Ledger Wallet derivation mode as wallet-btc's", async () => {
    const { txid, hex } = prevTx(BTC_CHANGE);
    const explorer = fakeExplorer({ txHex: { [txid]: hex } });
    const base = intent({}, txid);
    const craftWith = async (derivationMode: string) =>
      parseEnvelope(
        (
          await craftTransaction(
            explorer,
            "bitcoin",
            { ...base, data: { ...base.data, derivationMode } },
            { value: 0n, parameters: { feePerByte: "10" } },
          )
        ).transaction,
      );

    const [ledgerWallet, walletBtc] = await Promise.all([
      craftWith("native_segwit"),
      craftWith("Native SegWit"),
    ]);
    expect(ledgerWallet).toEqual(walletBtc);
    expect(ledgerWallet).toMatchObject({ segwit: true, additionals: ["bitcoin", "bech32"] });
  });

  it("does not opt in to replacement where the network does not relay it", async () => {
    const ltc = cryptoFor("litecoin");
    const tx = new Transaction();
    tx.addInput(Buffer.alloc(32, 1), 0);
    tx.addOutput(Buffer.from("0014" + "11".repeat(20), "hex"), 100_000n);
    const explorer = fakeExplorer({ txHex: { [tx.getId()]: tx.toHex() } });
    const recipient = "LUWPbpM43E2p7ZSh8cyTBEkvpHmr3cB8Ez";
    expect(ltc.validateAddress(recipient)).toBe(true);

    const crafted = await craftTransaction(
      explorer,
      "litecoin",
      intent(
        {
          recipient,
          data: {
            type: "bitcoin",
            derivationMode: "Legacy",
            inputs: [
              {
                txid: tx.getId(),
                vout: 0,
                value: "100000",
                address: recipient,
                path: "44'/2'/0'/0/0",
              },
            ],
          },
        },
        tx.getId(),
      ),
      { value: 0n, parameters: { feePerByte: "10" } },
    );
    const envelope = parseEnvelope(crafted.transaction);
    expect(envelope.inputs[0].sequence).toBe(0xffffffff);
    expect(envelope.segwit).toBe(false);
    expect(envelope.changePath).toBeUndefined();
    expect((crafted.details as CraftedDetails).replaceable).toBe(false);
  });

  it("rejects an envelope of another version", () => {
    expect(() => parseEnvelope(JSON.stringify({ version: 2 }))).toThrow(/version 2/);
  });
});
