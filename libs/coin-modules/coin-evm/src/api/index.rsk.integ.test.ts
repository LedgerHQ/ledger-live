import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM RSK Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://public-node.rsk.co",
      },
      explorer: {
        type: "blockscout",
        uri: "https://rootstock.blockscout.com/api",
      },
    };
    module = createApi(config as EvmConfig, "rsk");
  });

  describe("getBalance with EIP-1191 checksummed address", () => {
    /**
     * This address has a valid EIP-1191 checksum (for RSK chainId 30) but not a valid EIP-55 checksum.
     * Without proper address normalization, ethers.js will throw "bad address checksum" error.
     */
    it("accepts RSK addresses with EIP-1191 checksum that differs from EIP-55", async () => {
      // This address has EIP-1191 checksum for RSK (chainId 30), not EIP-55
      const rskAddress = "0xeF7778f630098Df7aD87cFEd8F4476e4c03eE329";

      // This should not throw "bad address checksum" error
      const result = await module.getBalance(rskAddress);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toEqual({
        value: expect.any(BigInt),
        asset: { type: "native" },
      });
    });
  });

  describe("getSequence with EIP-1191 checksummed address", () => {
    it("accepts RSK addresses with EIP-1191 checksum", async () => {
      const rskAddress = "0xeF7778f630098Df7aD87cFEd8F4476e4c03eE329";

      // This should not throw "bad address checksum" error
      const result = await module.getSequence(rskAddress);

      expect(typeof result).toBe("bigint");
    });
  });
});
