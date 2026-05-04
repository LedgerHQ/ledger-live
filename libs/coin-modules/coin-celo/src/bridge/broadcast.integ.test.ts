import { LocalWallet } from "@celo/wallet-local";
import { randomBytes } from "crypto";
import broadcast from "./broadcast";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const wallet = new LocalWallet();
    const pk = "0x" + randomBytes(32).toString("hex");
    wallet.addAccount(pk);

    const [from] = wallet.getAccounts();
    const tx = {
      from,
      to: from,
      value: "1",
      gas: 21000,
      maxFeePerGas: "1000000000000000",
      maxPriorityFeePerGas: "100000000000",
      chainId: 42220,
      nonce: 0,
    };

    const signed = await wallet.signTransaction(tx);

    await expect(broadcast({ signedOperation: { signature: signed.raw } } as any)).rejects.toThrow(
      /insufficient funds for gas \* price \+ value/,
    );
  });
});
