import * as bitcoin from "bitcoinjs-lib";
import { secp256k1 } from "@noble/curves/secp256k1";
import { broadcast } from "./broadcast";
import Xpub from "./wallet-btc/xpub";
import BitcoinLikeExplorer from "./wallet-btc/explorer";

function buildSignedTxHex(): { txHex: string; address: string } {
  const privateKey = secp256k1.utils.randomSecretKey();
  const publicKey = Buffer.from(secp256k1.getPublicKey(privateKey, true));
  const { address, output: p2wpkhScript } = bitcoin.payments.p2wpkh({
    pubkey: publicKey,
    network: bitcoin.networks.bitcoin,
  });

  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  psbt.addInput({
    hash: Buffer.alloc(32, 0xab),
    index: 0,
    witnessUtxo: { value: 100000, script: p2wpkhScript! },
  });
  psbt.addOutput({ address: address!, value: 10000 - 500 });

  psbt.signInput(0, {
    publicKey,
    sign: (hash: Buffer) =>
      Buffer.from(secp256k1.sign(new Uint8Array(hash), privateKey).toBytes("compact")),
  });
  psbt.finalizeAllInputs();
  return { txHex: psbt.extractTransaction().toHex(), address: address! };
}

describe("Broadcast", () => {
  it("throws when broadcasting a transaction spending nonexistent inputs", async () => {
    const { txHex, address } = buildSignedTxHex();

    const explorer = new BitcoinLikeExplorer({
      cryptoCurrency: {
        id: "bitcoin",
        explorerId: "btc",
      },
    } as any);

    const xpub = new Xpub({ explorer } as any);

    await expect(
      broadcast({
        account: { id: "js:2:bitcoin", bitcoinResources: { walletAccount: { xpub } } },
        signedOperation: {
          signature: txHex,
          operation: { senders: [address], extra: {} },
        },
      } as any),
    ).rejects.toThrow(/bad-txns-inputs-missingorspent/);
  });

  it("throws InvalidTransactionError when pre-broadcast UTXO check detects the input UTXO is already spent", async () => {
    const { txHex, address } = buildSignedTxHex();

    const explorer = new BitcoinLikeExplorer({
      cryptoCurrency: {
        id: "bitcoin",
        explorerId: "btc",
      },
    } as any);

    const xpub = new Xpub({ explorer } as any);

    // Real mainnet tx whose output 0 is confirmed-spent (spent_at_height: 949644)
    const spentTxHash = "1a7df85fd5afdb6ed9630f23b49379bcff840d570ab80ad4dc3ce02a53c3ca9b";

    await expect(
      broadcast({
        account: { id: "js:2:bitcoin", bitcoinResources: { walletAccount: { xpub } } },
        signedOperation: {
          signature: txHex,
          operation: {
            senders: [address],
            extra: {
              inputRefs: [{ hash: spentTxHash, outputIndex: 0, address }],
            },
          },
        },
      } as any),
    ).rejects.toMatchObject({
      name: "InvalidTransactionError",
      message: "utxos already spent",
    });
  });

  it("throws InvalidTransactionError when pre-broadcast UTXO check detects the input UTXO is not found", async () => {
    const { txHex, address } = buildSignedTxHex();

    const explorer = new BitcoinLikeExplorer({
      cryptoCurrency: {
        id: "bitcoin",
        explorerId: "btc",
      },
    } as any);

    const xpub = new Xpub({ explorer } as any);

    // Non-existent tx hash
    const nonExistentTxHash = "non-existent-tx-hash";

    await expect(
      broadcast({
        account: { id: "js:2:bitcoin", bitcoinResources: { walletAccount: { xpub } } },
        signedOperation: {
          signature: txHex,
          operation: {
            senders: [address],
            extra: {
              inputRefs: [{ hash: nonExistentTxHash, outputIndex: 0, address }],
            },
          },
        },
      } as any),
    ).rejects.toMatchObject({
      name: "InvalidTransactionError",
      message: "tx not found",
    });
  });
});
