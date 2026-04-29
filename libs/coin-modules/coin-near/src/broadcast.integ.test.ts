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
    const keyPair = nearAPI.utils.KeyPair.fromRandom("ed25519");
    const publicKey = keyPair.getPublicKey();
    const implicitAccountId = Buffer.from(publicKey.data).toString("hex");
    const provider = new nearAPI.providers.JsonRpcProvider({
      url: "https://near.coin.ledger.com/node",
    });
    const { hash } = (await provider.block({ finality: "final" })).header;
    const blockHashBytes = nearAPI.utils.serialize.base_decode(hash);
    const unsigned = nearAPI.transactions.createTransaction(
      implicitAccountId,
      publicKey,
      "near",
      1,
      [nearAPI.transactions.transfer("10000000000000000000")],
      blockHashBytes,
    );
    const signer = await nearAPI.InMemorySigner.fromKeyPair("mainnet", implicitAccountId, keyPair);
    const [, signedTransaction] = await nearAPI.transactions.signTransaction(
      unsigned,
      signer,
      implicitAccountId,
      "mainnet",
    );

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
