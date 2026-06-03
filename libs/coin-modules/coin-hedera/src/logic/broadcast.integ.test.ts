import { AccountId, Hbar, PrivateKey, TransactionId, TransferTransaction } from "@hashgraph/sdk";
import { broadcast } from "./broadcast";
import { serializeTransaction } from "./utils";
import { rpcClient } from "../network/rpc";
import { getMockedConfig } from "../test/fixtures/config.fixture";

describe("Broadcast", () => {
  const coinConfig = getMockedConfig();

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it("throws PAYER_ACCOUNT_NOT_FOUND when payer account does not exist", async () => {
    const senderKey = PrivateKey.generateED25519();
    const senderAccountId = AccountId.fromString("0.0.999999999");
    const recipient = AccountId.fromString("0.0.2");
    const client = await rpcClient.getInstance(coinConfig);

    const tx = new TransferTransaction()
      .addHbarTransfer(senderAccountId, Hbar.fromTinybars(-1))
      .addHbarTransfer(recipient, Hbar.fromTinybars(1))
      .setTransactionId(TransactionId.generate(senderAccountId))
      .freezeWith(client);
    const signedTx = await tx.sign(senderKey);
    const txHex = serializeTransaction(signedTx);

    await expect(
      broadcast({ configOrCurrencyId: coinConfig, txWithSignature: txHex }),
    ).rejects.toThrow(/failed precheck with status PAYER_ACCOUNT_NOT_FOUND/);
  });
});
