/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { Operation } from "@ledgerhq/types-live";
import { ApiPromise, HttpProvider, Keyring } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { cryptoWaitReady, encodeAddress, hdLedger, mnemonicGenerate } from "@polkadot/util-crypto";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { PolkadotAccount, Transaction } from "../types";
import { broadcast } from "./broadcast";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      node: {
        url: "https://polkadot-asset-hub-fullnodes.api.live.ledger.com",
      },
      sidecar: {
        url: "https://polkadot-asset-hub-sidecar.coin.ledger.com",
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

    const senderAddress = encodeAddress(senderKeyPair.publicKey, 0);
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

      const account = {
        id: `js:2:polkadot:${senderAddress}:`,
        freshAddress: senderAddress,
        currency: { id: "polkadot" },
        polkadotResources: { nonce: 0, unlockedBalance: new BigNumber(0) },
        pendingOperations: [] as Operation[],
      } as PolkadotAccount;

      const transaction = {
        mode: "send",
        amount: new BigNumber(15_000_000_000),
        recipient: receiverAddress,
        useAllAmount: false,
      } as Transaction;

      const operation = buildOptimisticOperation(account, transaction, new BigNumber(0));

      await expect(
        broadcast({
          signedOperation: { signature: signedTx.toHex(), operation },
          account,
        }),
      ).rejects.toThrow(/FundsUnavailable/);
    } finally {
      await api.disconnect();
    }
  });
});
