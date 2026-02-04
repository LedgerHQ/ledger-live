import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Optimism Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://mainnet.optimism.io",
      },
      explorer: {
        type: "none",
      },
    };
    module = createApi(config as EvmConfig, "optimism");
  });

  describe("getBlock", () => {
    it("returns block with more than 10 transactions for height 144931340", async () => {
      const result = await module.getBlock(144931340);

      // all the transactions are returned
      expect(result.transactions.length).toBe(61);

      // some other check but they are not the main concern of this test
      expect(result).toMatchObject({
        info: {
          hash: "0x15d04d3a7ddc6ea7470f05b61e78dd2170ceb273e6659693d0b0370d12cd8d14",
          height: 144931340,
          time: expect.any(Date),
        },
        transactions: expect.arrayContaining([
          expect.objectContaining({
            hash: expect.any(String),
            failed: expect.any(Boolean),
            operations: expect.any(Array),
            fees: expect.any(BigInt),
            feesPayer: expect.any(String),
          }),
        ]),
      });
    });
  });
});
