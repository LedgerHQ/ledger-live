import { Api, BufferTxData, MemoNotSupported, Operation } from "@ledgerhq/coin-framework/api/types";
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
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/10",
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

  describe("listOperations", () => {
    /**
     * Internal transactions should be returned for accounts that receive ETH via internal transactions (e.g., from
     * smart contract interactions).
     *
     * Address 0xe0b719786c5511115ca9cdb38f6f7b3a8c97b105 on Optimism has internal transactions where it receives ETH
     * from smart contracts, but these are not appearing in the operations list.
     *
     * @see https://optimistic.etherscan.io/tx/0x273531e52133459d99420045b2d763d8f3d616d0616eb2f9d6b41376101f6365
     */
    it("returns internal transactions for address receiving ETH via smart contracts", async () => {
      const [operations] = await module.listOperations(
        "0xe0b719786c5511115ca9cdb38f6f7b3a8c97b105",
        {
          minHeight: 0,
          order: "desc",
        },
      );

      const internalOperations = operations.filter(
        (op: Operation) => op.details?.internal === true,
      );

      expect(internalOperations.length).toBeGreaterThan(0);

      internalOperations.forEach((op: Operation) => {
        expect(op.type).toMatch(/^(IN|OUT)$/);
        expect(op.asset.type).toBe("native");
        expect(op.value).toBeGreaterThanOrEqual(0n);
        expect(op.tx.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);

        // Internal transactions may or may not have a parent "normal" transaction.
        // When they don't, we currently expect fee=0 and blockHash="" (not available
        // from the explorer without a separate request). When they do, they may have
        // a non-zero fee and a valid block hash. This test only verifies that fees are
        // non-negative and that the block hash is structurally valid, not specific values.
        expect(op.tx.fees).toBeGreaterThanOrEqual(0n);
        expect(op.tx.block.hash).toMatch(/^$|^0x[A-Fa-f0-9]{64}$/);
      });
    });
  });
});
