import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { serializeTransaction } from "viem";
import { serializeTransaction as serializeCeloTx } from "viem/celo";
import type { TransactionSerializableCIP64 } from "viem/celo";
import broadcast from "./broadcast";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const tx = {
      chainId: 42220,
      nonce: 0,
      gas: 21000n,
      maxFeePerGas: 1000000000000000n,
      maxPriorityFeePerGas: 100000000000n,
      to: account.address,
      value: 1n,
      type: "eip1559" as const,
    };

    const signed = await account.signTransaction(tx, { serializer: serializeTransaction });

    await expect(broadcast({ signedOperation: { signature: signed } } as any)).rejects.toThrow(
      /insufficient funds for gas \* price \+ value/,
    );
  });

  it("throws on insufficient funds for a CIP-64 transaction", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    const tx: TransactionSerializableCIP64 = {
      chainId: 42220,
      nonce: 0,
      gas: 100000n,
      maxFeePerGas: 1000000000000000n,
      maxPriorityFeePerGas: 100000000000n,
      to: account.address,
      value: 1n,
      type: "cip64",
      feeCurrency: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    };

    const signed = await account.signTransaction(tx, { serializer: serializeCeloTx });

    await expect(broadcast({ signedOperation: { signature: signed } } as any)).rejects.toThrow(
      /insufficient (funds|balance)/i,
    );
  });
});
