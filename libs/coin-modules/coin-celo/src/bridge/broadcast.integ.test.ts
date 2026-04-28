import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { serializeTransaction } from "viem";
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

    await expect(
      broadcast({ signedOperation: { signature: signed } } as any),
    ).rejects.toThrow(/insufficient funds for gas \* price \+ value/);
  });
});
