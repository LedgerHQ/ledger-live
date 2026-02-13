import type { AlpacaApi, FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/types";
import { getEnv } from "@ledgerhq/live-env";
import { createApi } from ".";

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
        intentType: "transaction",
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
      const { items: operations1, next: token1 } = await module.listOperations(binance, {
        minHeight: 0,
        order,
      });

      expect(operations1.length).toBeGreaterThan(2);
      expect(token1.length).toBeGreaterThan(0);

      const { items: operations2 } = await module.listOperations(binance, {
        minHeight: 0,
        cursor: token1,
        order,
      });
      expect(operations2.length).toBeGreaterThan(2);
      expect(operations2[0].tx.hash).not.toBe(operations1[0].tx.hash);

      // check that none of the operations in operations2 are in operations1
      expect(operations2.every(op2 => !operations1.some(op1 => op1.tx.hash === op2.tx.hash))).toBe(
        true,
      );
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
      const { items: operations, next: cursor } = await module.listOperations(
        "0xd8908c165dee785924e7421a0fd0418a19d5daeec395fd505a92a0fd3117e428",
        { minHeight: 0, order: "asc" },
      );

      // assume it has not a lot of operations
      // at time of writing, it has only 2 operations
      expect(operations.length).toBeLessThan(10);
      expect(operations.length).toBeGreaterThan(0);

      expect(cursor).toBeUndefined();
    });
  });

  describe("listOperations (staking)", () => {
    let txs: Operation[];

    beforeAll(async () => {
      const result = await module.listOperations(
        "0x13d73cab19d2cf14e39289b122ed93fb0f9edd00e4c829e0cefb1f0611c54a8f",
        { minHeight: 0, order: "asc" },
      );
      txs = result.items;
    });

    it("should map undelegate operations when it's not the first move call", async () => {
      const tx1 = txs.find(t => t.id === "4UtCqCH3oNEdaprZR9UjaMGg6HgLn3V3q3FEcvs5vieM");
      expect(tx1?.type).toBe("UNDELEGATE");
      const tx2 = txs.find(t => t.id === "JEGnHCx2mtpDin216kbUBXm7V5rdMSPSUmgYbP3yxTEf");
      expect(tx2?.type).toBe("UNDELEGATE");
    });
  });

  describe("listOperations", () => {
    let txs: Operation[];

    beforeAll(async () => {
      const result = await module.listOperations(SENDER, { minHeight: 0, order: "asc" });
      txs = result.items;
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      txs.forEach(operation => {
        expect(operation.senders.concat(operation.recipients)).toContain(SENDER);
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toBeLessThanOrEqual(txs.length);
    });

    it("at least operation should be IN", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "IN")).toBe(true);
    });

    it("at least operation should be OUT", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "OUT")).toBe(true);
    });

    it("uses the minHeight to filter", async () => {
      const minHeightTxs = await module.listOperations(SENDER, {
        minHeight: 154925948,
        order: "asc",
      });
      expect(txs.length).toBeGreaterThanOrEqual(minHeightTxs.items.length);
    });

    it("returns block height as a number", async () => {
      txs.forEach(t => {
        expect(t.tx.block.height).toBeGreaterThan(0);
      });
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

    it("returns 0 when address is not found", async () => {
      const result = await module.getBalance(
        "0xcafebabe00000000000000000000000000000000000000000000000000000000",
      );

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });
  });

  describe("getLastBlock", () => {
    it("returns the last block", async () => {
      // When
      const result = await module.lastBlock();
      // Then
      expect(result.hash).toMatch(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/); // base58
      expect(result.height).toBeGreaterThan(0);
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
      const block = await module.getBlock(195177985);
      expect(block.info.height).toEqual(195177985);
      expect(block.info.hash).toEqual("AzoHwjcCXkeiWoBVyWwZcE171zjxochFmcr9eQoNQyYn");
      expect(block.info.time).toEqual(new Date(1759138080141));
      expect(block.info.parent?.height).toEqual(195177984);
      expect(block.info.parent?.hash).toEqual("A15NYkPDyKLZS4Swik7AY2mnLxwFET4kyNV6ChZ8tVJP");
      expect(block.transactions.length).toEqual(12);
      const tx = block.transactions[9];
      const senderOp = tx.operations[0];
      const receipientOp = tx.operations[1];
      expect(tx.hash).toEqual("J3ddkv4TRqr4LviCbA3JyJCji5Kg5BcaBTkd6nMY5WXN");
      expect(tx.operations.length).toEqual(2);
      expect(senderOp.address).toEqual(
        "0x2c814ceb68d1cb7168207b16754b1cf57e735685c4e5d87c4f50906edcc57c1c",
      );
      expect(senderOp.peer).toEqual(
        "0xb37b298c9164c28c8aaf989a49416e3c323b67bc2b96a54501b524419ebb4ead",
      );
      expect(senderOp.amount).toEqual(BigInt(-5));
      expect(receipientOp.address).toEqual(
        "0xb37b298c9164c28c8aaf989a49416e3c323b67bc2b96a54501b524419ebb4ead",
      );
      expect(receipientOp.peer).toEqual(
        "0x2c814ceb68d1cb7168207b16754b1cf57e735685c4e5d87c4f50906edcc57c1c",
      );
      expect(receipientOp.amount).toEqual(BigInt(5));
    });
  });

  describe("getValidators", () => {
    it("returns at least a hundred validators with expected fields", async () => {
      const page = await module.getValidators();

      expect(page.items).toEqual(expect.any(Array));
      expect(page.items.length).toBeGreaterThanOrEqual(100);

      const v = page.items[0];

      expect(v).toHaveProperty("address");
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("description");
      expect(v).toHaveProperty("url");
      expect(v).toHaveProperty("logo");
      expect(v).toHaveProperty("balance");
      expect(v).toHaveProperty("commissionRate");
      expect(v).toHaveProperty("apy");

      // values should not be empty
      expect(typeof v.address).toBe("string");
      expect(v.address.length).toBeGreaterThan(0);
      expect(typeof v.name).toBe("string");
      expect(v.name.length).toBeGreaterThan(0);
      expect(typeof v.description).toBe("string");
      expect((v.description as string).length).toBeGreaterThan(0);
      expect(typeof v.url).toBe("string");
      expect((v.url as string).length).toBeGreaterThan(0);
      expect(typeof v.logo).toBe("string");
      expect((v.logo as string).length).toBeGreaterThan(0);
      expect(v.balance as bigint).toBeGreaterThanOrEqual(0n);
      expect(typeof v.commissionRate).toBe("string");
      expect((v.commissionRate as string).length).toBeGreaterThan(0);
      expect(typeof v.apy).toBe("number");
    });
  });

  describe("getStakes", () => {
    test("Account 0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d", async () => {
      const stakes = await module.getStakes(
        "0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d",
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
        expect(stake.details).toMatchObject({
          activeEpoch: expect.any(Number),
          requestEpoch: expect.any(Number),
        });
      });
    });
  });
});
