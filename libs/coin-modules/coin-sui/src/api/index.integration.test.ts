import type {
  AlpacaApi,
  FeeEstimation,
  Operation,
  Pagination,
} from "@ledgerhq/coin-framework/api/types";
import { createApi } from ".";
import { getEnv } from "@ledgerhq/live-env";

describe("Sui Api", () => {
  let module: AlpacaApi;
  const SENDER = "0xc6dcb5b920f2fdb751b4a8bad800a4ee04257020d8d6e493c8103b760095016e";
  const RECIPIENT = "0xba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561";

  beforeAll(() => {
    module = createApi({
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100_000);

      // When
      const result: FeeEstimation = await module.estimateFees({
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: amount,
      });

      // Then
      expect(result.value).toBeGreaterThan(0);
    });
  });

  describe("listOperations, testing cursor logic", () => {
    // this account has a lot of operations
    const binance = "0x935029ca5219502a47ac9b69f556ccf6e2198b5e7815cf50f68846f723739cbd";

    async function testListOperations(order: "asc" | "desc" | undefined) {
      const baseOpts: Pagination = { minHeight: 0 };
      if (order) {
        baseOpts.order = order;
      }

      const [operations1, token1] = await module.listOperations(binance, baseOpts);

      expect(operations1.length).toBeGreaterThan(2);
      expect(token1).toBeTruthy();

      const [operations2, _] = await module.listOperations(binance, {
        ...baseOpts,
        lastPagingToken: token1,
      });
      expect(operations2.length).toBeGreaterThan(2);
      expect(operations2[0].tx.hash).not.toBe(operations1[0].tx.hash);

      // check that none of the operations in operations2 are in operations1
      expect(
        operations2.every(op2 => !operations1.some(op1 => op1.tx.hash === op2.tx.hash)),
      ).toBeTruthy();
    }

    it("should fetch operations successfully in desc order", async () => {
      await testListOperations("desc");
    });
    it("should fetch operations successfully in asc order", async () => {
      await testListOperations("asc");
    });
    it("should fetch operations successfully in default order", async () => {
      await testListOperations(undefined);
    });

    it("shouldn't return cursor on last page", async () => {
      const [operations, cursor] = await module.listOperations(
        "0xd8908c165dee785924e7421a0fd0418a19d5daeec395fd505a92a0fd3117e428",
        { minHeight: 0, order: "asc" },
      );

      // assume it has not a lot of operations
      // at time of writing, it has only 2 operations
      expect(operations.length).toBeLessThan(10);
      expect(operations.length).toBeGreaterThan(0);

      expect(cursor).toBe("");
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];

    beforeAll(async () => {
      [txs] = await module.listOperations(SENDER, { minHeight: 0, order: "asc" });
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toBeLessThanOrEqual(txs.length);
    });

    it("at least operation should be IN", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "IN")).toBeTruthy();
    });

    it("at least operation should be OUT", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "OUT")).toBeTruthy();
    });

    it("should return 2 operations in case of a self send", async () => {
      const [selfTxs] = await module.listOperations(
        "0xb37b298c9164c28c8aaf989a49416e3c323b67bc2b96a54501b524419ebb4ead",
        { minHeight: 0, order: "asc" },
      );
      expect(selfTxs.length).toBeGreaterThanOrEqual(4);
      // https://suiscan.xyz/mainnet/tx/9vtfErSE4xpL89QAg6sppveJruNj6vY76AvmLhYNmx8R
      const selfSend = selfTxs.filter(
        tx => tx.id === "9vtfErSE4xpL89QAg6sppveJruNj6vY76AvmLhYNmx8R",
      );
      expect(selfSend.length).toBe(2);
      expect(selfSend.filter(t => t.type === "IN")[0].value).toBe(5);
      expect(selfSend.filter(t => t.type === "IN")[0].tx.fees).toBe(495000);
      expect(selfSend.filter(t => t.type === "OUT")[0].value).toBe(-5);
      expect(selfSend.filter(t => t.type === "OUT")[0].tx.fees).toBe(495000);
    });

    it("uses the minHeight to filter", async () => {
      const minHeightTxs = await module.listOperations(SENDER, {
        minHeight: 154925948,
        order: "asc",
      });
      expect(txs.length).toBeGreaterThanOrEqual(minHeightTxs.length);
    });

    it("returns block height as a number", async () => {
      expect(txs.every(t => typeof t.tx.block.height === "number")).toBeTruthy();
    });

    it("should fail when address is invalid", async () => {
      // capture exception with jest
      await expect(
        module.listOperations("0xABCDEF0000000000000000000000000000000001", {
          minHeight: 0,
          order: "asc",
        }),
      ).rejects.toThrow("Invalid params");
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const [acc] = await module.getBalance(SENDER);

      // Then
      expect(acc.value).toBeGreaterThan(0);
    });
  });

  describe("getLastBlock", () => {
    it("returns the last block", async () => {
      // When
      const result = await module.lastBlock();
      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    test("getBlockInfo should get block info by id or sequence number", async () => {
      const block = await module.getBlockInfo(164167623);
      expect(block.height).toEqual(164167623);
      expect(block.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(block.time).toEqual(new Date(1751696298663));
      expect(block.parent?.height).toEqual(164167622);
      expect(block.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
    });
  });

  describe("getBlock", () => {
    test("getBlock should get block by id or sequence number", async () => {
      const block = await module.getBlock(164167623);
      expect(block.info.height).toEqual(164167623);
      expect(block.info.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(block.info.time).toEqual(new Date(1751696298663));
      expect(block.info.parent?.height).toEqual(164167622);
      expect(block.info.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(block.transactions.length).toEqual(19);
    });
  });

  describe("getStakes", () => {
    test("Account 0xea438b6ce07762ea61e04af4d405dfcf197d5f77d30765f365f75460380f3cce", async () => {
      const stakes = await module.getStakes(
        "0xea438b6ce07762ea61e04af4d405dfcf197d5f77d30765f365f75460380f3cce",
      );
      expect(stakes.items.length).toBeGreaterThan(0);
      stakes.items.forEach(stake => {
        expect(stake.uid).toMatch(/0x[0-9a-z]+/);
        expect(stake.address).toMatch(/0x[0-9a-z]+/);
        expect(stake.delegate).toMatch(/0x[0-9a-z]+/);
        expect(stake.state).toMatch(/(activating|active|inactive)/);
        expect(stake.asset).toEqual({ type: "native" });
        expect(stake.amount).toBeGreaterThan(0);
        expect(stake.amountDeposited).toBeGreaterThan(0);
        expect(stake.amountRewarded).toBeGreaterThanOrEqual(0);
        // @ts-expect-error properties are defined
        expect(stake.amount).toEqual(stake.amountDeposited + stake.amountRewarded);
        expect(stake.details).toBeDefined();
      });
    });
  });
});
