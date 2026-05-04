import { Transaction, TransactionPayload, UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import broadcast from "./broadcast";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const seed = randomBytes(32);
    const secretKey = new UserSecretKey(seed);
    const signer = new UserSigner(secretKey);
    const sender = signer.getAddress();
    const receiver = sender;
    const tx = new Transaction({
      nonce: 0,
      sender,
      receiver,
      value: "1",
      gasLimit: 50000,
      chainID: "1",
      data: new TransactionPayload(""),
    });
    const signature = await signer.sign(tx.serializeForSigning());

    await expect(
      broadcast({
        signedOperation: {
          signature: Buffer.from(signature).toString("hex"),
          rawData: tx.toPlainObject(),
        },
      } as any),
    ).rejects.toThrow(/insufficient funds/);
  });
});
