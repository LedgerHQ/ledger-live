import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { cryptoWaitReady, encodeAddress, hdLedger, mnemonicGenerate } from "@polkadot/util-crypto";
import coinConfig from "../config";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      node: {
        url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com",
      },
      sidecar: {
        url: "https://polkadot-mainnet-rest-api.coin.ledger.com/v1",
      },
      indexer: {
        url: "https://explorers.api.live.ledger.com/blockchain/dot_asset_hub",
      },
    }));
  });

  it("throws on not deployed and empty account", async () => {
    const senderSeed = mnemonicGenerate(24);
    const receiverSeed = mnemonicGenerate(24);

    const senderKeyPair = hdLedger(senderSeed, "m/44'/354'/0'/0'/0'");
    const receiverKeyPair = hdLedger(receiverSeed, "m/44'/354'/0'/0'/0'");

    const receiverAddress = encodeAddress(receiverKeyPair.publicKey, 0);

    await cryptoWaitReady();

    const provider = new HttpProvider("https://polkadot-asset-hub-fullnodes.api.live.ledger.com");
    const api = await ApiPromise.create({
      provider: provider as ProviderInterface,
      noInitWarn: true,
    });

    try {
      const signerPair = new Keyring().addFromPair(senderKeyPair);
      const signedTx = await api.tx.balances
        .transferKeepAlive(receiverAddress, 15_000_000_000n)
        .signAsync(signerPair, { nonce: 0 });

      await expect(broadcast(signedTx.toHex())).rejects.toThrow(/FundsUnavailable/);
    } finally {
      await api.disconnect();
    }
  });
});
