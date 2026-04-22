import { Wallet } from "ethers";
import broadcast from "./broadcast";
import { setCoinConfig } from "../config";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(currency => {
      switch (currency) {
        case "ethereum":
          return {
            info: {
              status: { type: "active" },
              node: {
                type: "ledger",
                explorerId: "eth",
              },
            },
          } as any;
        case "sonic":
          return {
            info: {
              status: { type: "active" },
              node: {
                type: "external",
                uri: "https://sonic.coin.ledger.com",
              },
            },
          } as any;
        default:
          throw new Error("Unhandled currency");
      }
    });
  });

  it.each([
    ["ethereum", 1],
    ["sonic", 146],
  ])("throws on insufficient funds on %s", async (network, chainId) => {
    const wallet = Wallet.createRandom();
    const tx = {
      to: wallet.address,
      value: 1n,
      nonce: 0,
      gasLimit: 21000n,
      maxFeePerGas: 10000000000000n,
      maxPriorityFeePerGas: 1000000000n,
      chainId,
    };
    const signature = await wallet.signTransaction(tx);

    await expect(broadcast({ id: network } as CryptoCurrency, { signature })).rejects.toThrow(
      /insufficient funds for gas \* price \+ value|InsufficientFunds/,
    );
  });
});
