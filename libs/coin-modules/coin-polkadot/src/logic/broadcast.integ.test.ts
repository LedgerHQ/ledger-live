import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { cryptoWaitReady, encodeAddress, hdLedger, mnemonicGenerate } from "@polkadot/util-crypto";
import { polkadotDefaults, type PolkadotCoinConfig } from "../config";
import { broadcast } from "./broadcast";

const config: PolkadotCoinConfig = polkadotDefaults.assethub_polkadot;

describe("Broadcast", () => {
  it("throws on not deployed and empty account", async () => {
    const senderSeed = mnemonicGenerate(24);
    const receiverSeed = mnemonicGenerate(24);

    const senderKeyPair = hdLedger(senderSeed, "m/44'/354'/0'/0'/0'");
    const receiverKeyPair = hdLedger(receiverSeed, "m/44'/354'/0'/0'/0'");

    const receiverAddress = encodeAddress(receiverKeyPair.publicKey, 0);

    await cryptoWaitReady();

    const provider = new HttpProvider(polkadotDefaults.assethub_polkadot.node.url);
    const api = await ApiPromise.create({
      provider: provider as ProviderInterface,
      noInitWarn: true,
    });

    try {
      const signerPair = new Keyring().addFromPair(senderKeyPair);
      const signedTx = await api.tx.balances
        .transferKeepAlive(receiverAddress, 15_000_000_000n)
        .signAsync(signerPair, { nonce: 0 });

      await expect(broadcast(config, signedTx.toHex(), "polkadot")).rejects.toThrow(
        /FundsUnavailable/,
      );
    } finally {
      await api.disconnect();
    }
  });
});
