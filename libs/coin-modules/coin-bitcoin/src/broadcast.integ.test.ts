import * as bitcoin from "bitcoinjs-lib";
import { secp256k1 } from "@noble/curves/secp256k1";
import { broadcast } from "./broadcast";
import Xpub from "./wallet-btc/xpub";
import BitcoinLikeExplorer from "./wallet-btc/explorer";

describe("Broadcast", () => {
  it("throws when broadcasting a transaction spending nonexistent inputs", async () => {
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
    const txHex = psbt.extractTransaction().toHex();

    const explorer = new BitcoinLikeExplorer({
      cryptoCurrency: {
        id: "bitcoin",
        explorerId: "btc",
      },
    } as any);
    const xpub = new Xpub({
      explorer,
    } as any);

    await expect(
      broadcast({
        account: { id: "js:2:bitcoin", bitcoinResources: { walletAccount: { xpub } } },
        signedOperation: {
          signature: txHex,
        },
      } as any),
    ).rejects.toThrow(/bad-txns-inputs-missingorspent/);
  });
});
