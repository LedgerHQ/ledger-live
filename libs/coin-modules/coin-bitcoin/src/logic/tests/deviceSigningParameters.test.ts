import { Psbt, address as btcAddress } from "bitcoinjs-lib";
import cashaddr from "cashaddrjs";
import { cryptoFor } from "../selectUtxos";
import { deviceSigningParameters } from "../signingRequest";
import { ADDRESSES, fundingTransaction } from "./helpers/keys";

// A Bitcoin Cash P2PKH address, in its legacy and cashaddr forms (same key hash).
const BCH_LEGACY = "1mW6fDEMjKrDHvLvoEsaeLxSCzZBf3Bfg";
const BCH_CASHADDR = cashaddr.encode(
  "bitcoincash",
  "P2PKH",
  new Uint8Array(btcAddress.fromBase58Check(BCH_LEGACY).hash),
);

/** A one-input PSBT from `sender` to `recipient`, carrying its previous transaction. */
function psbt(currencyId: string, sender: string, recipient: string): string {
  const crypto = cryptoFor(currencyId);
  const funding = fundingTransaction(crypto.toOutputScript(sender), 100_000);
  return new Psbt()
    .addInput({ hash: funding.getId(), index: 0, nonWitnessUtxo: funding.toBuffer() })
    .addOutput({ script: crypto.toOutputScript(recipient), value: 90_000 })
    .toBase64();
}

describe("deviceSigningParameters", () => {
  it("gives Bitcoin Cash the cashaddr flag of the recipient's format", () => {
    const tx = psbt("bitcoin_cash", BCH_LEGACY, BCH_CASHADDR);
    // Without a recipient: the cashaddr format Ledger Wallet shows a P2PKH recipient in.
    expect(deviceSigningParameters("bitcoin_cash", tx).additionals).toEqual([
      "bitcoin_cash",
      "bip143",
      "cashaddr",
    ]);
    expect(
      deviceSigningParameters("bitcoin_cash", tx, { recipient: BCH_CASHADDR }).additionals,
    ).toEqual(["bitcoin_cash", "bip143", "cashaddr"]);
    expect(
      deviceSigningParameters("bitcoin_cash", tx, { recipient: BCH_LEGACY }).additionals,
    ).toEqual(["bitcoin_cash", "bip143"]);
  });

  it("describes the inputs from their previous transactions", () => {
    const tx = psbt("bitcoin", ADDRESSES.legacy, ADDRESSES.legacy);
    const [input] = deviceSigningParameters("bitcoin", tx).inputs;
    const funding = fundingTransaction(
      cryptoFor("bitcoin").toOutputScript(ADDRESSES.legacy),
      100_000,
    );
    expect(input).toEqual({
      txid: funding.getId(),
      vout: 0,
      value: "100000",
      prevTxHex: funding.toHex(),
      sequence: 0xffffffff,
    });
  });

  it("refuses a PSBT input without its previous transaction", () => {
    // An input carrying only the spent output, as a Taproot-only PSBT signer would accept.
    const script = cryptoFor("bitcoin").toOutputScript(ADDRESSES.nativeSegwit);
    const tx = new Psbt()
      .addInput({ hash: "aa".repeat(32), index: 0, witnessUtxo: { script, value: 10_000 } })
      .addOutput({ script, value: 9_000 })
      .toBase64();
    expect(() => deviceSigningParameters("bitcoin", tx)).toThrow(
      "input 0 does not carry its previous transaction",
    );
  });
});
