import * as nearAPI from "near-api-js";
import { broadcast } from "./broadcast";
import { setCoinConfig } from "./config";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(
      () =>
        ({
          status: { type: "active" as const },
          infra: {
            API_NEAR_PRIVATE_NODE: "https://near.coin.ledger.com/node",
          },
        }) as any,
    );
  });

  it("throws on unknown signer", async () => {
    const keyPair = nearAPI.KeyPair.fromRandom("ed25519");
    const publicKey = keyPair.getPublicKey();
    const implicitAccountId = Buffer.from(publicKey.data).toString("hex");
    const provider = new nearAPI.JsonRpcProvider({
      url: "https://near.coin.ledger.com/node",
    });
    const { hash } = (await provider.viewBlock({ finality: "final" })).header;
    const blockHashBytes = nearAPI.baseDecode(hash);
    const unsigned = nearAPI.createTransaction(
      implicitAccountId,
      publicKey,
      "near",
      1,
      [nearAPI.actions.transfer(10000000000000000000n)],
      blockHashBytes,
    );
    const signer = new nearAPI.KeyPairSigner(keyPair);
    const { signedTransaction } = await signer.signTransaction(unsigned);

    // NOTE Unlerlying message is SignerDoesNotExist
    await expect(
      broadcast({
        signedOperation: {
          signature: Buffer.from(signedTransaction.encode()).toString("base64"),
        },
      } as any),
    ).rejects.toThrow(/INVALID_TRANSACTION/);
  });
});
