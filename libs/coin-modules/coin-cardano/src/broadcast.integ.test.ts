import { randomBytes } from "crypto";
import BigNumber from "bignumber.js";
import { Bip32PrivateKey } from "@stricahq/bip32ed25519";
import {
  Transaction as TyphonTransaction,
  address as TyphonAddress,
  types as TyphonTypes,
} from "@stricahq/typhonjs";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  it("throws when broadcasting a transaction spending nonexistent inputs", async () => {
    const privKey = await Bip32PrivateKey.fromEntropy(randomBytes(64));
    const pubKeyBytes = privKey.toBip32PublicKey().toPublicKey().toBytes();

    const address = new TyphonAddress.EnterpriseAddress(TyphonTypes.NetworkId.MAINNET, {
      type: TyphonTypes.HashType.ADDRESS,
      hash: randomBytes(28),
    });
    const typhonTx = new TyphonTransaction({
      protocolParams: {
        minFeeA: new BigNumber(0),
        minFeeB: new BigNumber(0),
        priceMem: new BigNumber(0),
        priceSteps: new BigNumber(0),
      } as any,
    });
    const finalTx = typhonTx.paymentTransaction({
      inputs: [{ txId: "a".repeat(64), index: 0, amount: new BigNumber(1), tokens: [], address }],
      outputs: [],
      changeAddress: address,
    } as any);

    const txHash = finalTx.getTransactionHash();
    finalTx.addWitness({
      publicKey: Buffer.from(pubKeyBytes),
      signature: privKey.toPrivateKey().sign(txHash),
    });

    const { payload } = finalTx.buildTransaction();

    await expect(
      broadcast({
        account: { currency: { id: "cardano" } },
        signedOperation: { signature: payload },
      } as any),
    ).rejects.toThrow(/tx submission failed/);
  });
});
