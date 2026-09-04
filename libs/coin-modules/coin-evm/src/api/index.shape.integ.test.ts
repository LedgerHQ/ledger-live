import { fail } from "assert";
import { EvmConfig } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { createApi } from "./index";

describe("Shape (external node)", () => {
  describe("getBlock", () => {
    const shapeConfig: EvmConfig = {
      chainId: 360,
      name: "Shape",
      node: {
        type: "external",
        uri: "https://mainnet.shape.network",
      },
      explorer: {
        type: "blockscout",
        uri: "https://shapescan.xyz/api",
      },
      supportedTokens: ["erc721", "erc1155"],
    };
    const module = createApi("shape");

    it("should return WETH mint from Deposit log in block 26327282 (tx 0x08761e…) see BACK-10995", async () => {
      const weth = "0x4200000000000000000000000000000000000006";
      const expectedAmount = 200000000000000n;
      const txHash = "0x08761ed077ea43c8bd56cf7c7e5ab2180e1cb06533afa34b2ac3778f9f5d13a8";

      const block = await module.getBlock(createMockEvmContext(shapeConfig), 26327282);
      const tx = block.transactions.find(t => t.hash === txHash);
      if (!tx) {
        fail(`Transaction ${txHash} not found in block ${26327282}`);
      }
      expect(tx.operations).toContainEqual(
        expect.objectContaining({
          type: "transfer",
          asset: {
            type: "erc20",
            assetReference: weth,
          },
          amount: expectedAmount,
        }),
      );
    });
  });
});
