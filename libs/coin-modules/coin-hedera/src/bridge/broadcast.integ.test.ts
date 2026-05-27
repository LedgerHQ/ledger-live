import { AccountId, Hbar, PrivateKey, TransactionId, TransferTransaction } from "@hashgraph/sdk";
import { serializeTransaction } from "../logic/utils";
import { rpcClient } from "../network/rpc";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it("throws PAYER_ACCOUNT_NOT_FOUND when payer account does not exist", async () => {
    const senderKey = PrivateKey.generateED25519();
    const senderAccountId = AccountId.fromString("0.0.999999999");
    const recipient = AccountId.fromString("0.0.2");
    const client = await rpcClient.getInstance();

    const tx = new TransferTransaction()
      .addHbarTransfer(senderAccountId, Hbar.fromTinybars(-1))
      .addHbarTransfer(recipient, Hbar.fromTinybars(1))
      .setTransactionId(TransactionId.generate(senderAccountId))
      .freezeWith(client);
    const signedTx = await tx.sign(senderKey);
    const txHex = serializeTransaction(signedTx);

    await expect(
      broadcast({
        signedOperation: {
          signature: txHex,
          operation: { id: "integ", hash: "", extra: {} },
        },
      } as any),
    ).rejects.toThrow(/failed precheck with status PAYER_ACCOUNT_NOT_FOUND/);
  });
});
