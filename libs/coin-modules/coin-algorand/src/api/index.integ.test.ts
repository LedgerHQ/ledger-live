import { createApi } from ".";

describe("Algorand Api (mainnet)", () => {
  // Algorand Foundation address - a well-known address with transaction history
  const SENDER = "737777777777777777777777777777777777777777777777777UFEJ2CI";
  const api = createApi({
    node: "https://algorand.coin.ledger.com/ps2/v2",
    indexer: "https://algorand.coin.ledger.com/idx2/v2",
  });

  describe("getBalance", () => {
    it("returns a balance for an existing address", async () => {
      // When
      const result = await api.getBalance(SENDER);

      // Then
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(0n);
      expect(result[0].locked).toBeGreaterThanOrEqual(0n);
    });

    it("returns balance with locked amount (minimum balance)", async () => {
      // When
      const result = await api.getBalance(SENDER);

      // Then
      // Algorand requires minimum balance of 0.1 ALGO (100000 microAlgos)
      expect(result[0].locked).toBeGreaterThanOrEqual(100000n);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await api.lastBlock();

      // Then
      expect(result.height).toBeGreaterThan(0);
      expect(typeof result.hash).toBe("string");
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info for a specific height", async () => {
      // Given - Get the current block height first
      const lastBlockInfo = await api.lastBlock();
      const targetHeight = lastBlockInfo.height - 10; // Get a block from 10 rounds ago

      // When
      const result = await api.getBlockInfo(targetHeight);

      // Then
      expect(result.height).toBe(targetHeight);
      expect(typeof result.hash).toBe("string");
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time.getTime()).toBeGreaterThan(0);
    });
  });

  describe("estimateFees", () => {
    it("returns estimated fees", async () => {
      // When
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        amount: 1000000n,
        recipient: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      });

      // Then
      // Algorand minimum fee is 1000 microAlgos
      expect(result.value).toBeGreaterThanOrEqual(1000n);
    });

    it("returns estimated fees for ASA token transfer", async () => {
      // Given - USDC on Algorand mainnet
      const USDC_ASSET_ID = "31566704";
      const RECIPIENT = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

      // When
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        amount: 1000000n, // 1 USDC
        recipient: RECIPIENT,
      });

      // Then
      // ASA transfers also have minimum fee of 1000 microAlgos
      // Fee should be exactly 1000 for standard ASA transfers
      expect(result.value).toBeGreaterThanOrEqual(1000n);
    });
  });

  describe("listOperations", () => {
    it("returns operations for an address", async () => {
      // When
      const [operations, nextToken] = await api.listOperations(SENDER, {
        minHeight: 0,
        order: "desc",
      });

      // Then
      expect(operations.length).toBeGreaterThan(0);
      expect(typeof nextToken).toBe("string");

      // Verify operation structure
      const op = operations[0];
      expect(op.id).not.toBeUndefined();
      expect(op.type).toMatch(/^(IN|OUT|OPT_IN|OPT_OUT)$/);
      expect(op.value).toBeGreaterThanOrEqual(0n);
      expect(op.asset).not.toBeUndefined();
      expect(op.senders).toBeInstanceOf(Array);
      expect(op.recipients).toBeInstanceOf(Array);
      expect(op.tx.hash).toEqual(expect.any(String));
      expect(op.tx.block.height).toBeGreaterThan(0);
      expect(op.tx.fees).toBeGreaterThanOrEqual(0n);
      expect(op.tx.date).toBeInstanceOf(Date);
    });

    it("returns operations in ascending order when specified", async () => {
      // When
      const [operations] = await api.listOperations(SENDER, {
        minHeight: 0,
        order: "asc",
      });

      // Then
      if (operations.length > 1) {
        // Check ascending order by block height
        for (let i = 1; i < operations.length; i++) {
          expect(operations[i].tx.block.height).toBeGreaterThanOrEqual(
            operations[i - 1].tx.block.height,
          );
        }
      }
    });

    it("paginates across at least two pages", async () => {
      // Given - use a small limit to force pagination
      const limit = 5;

      // When - fetch first page
      const [firstPageOps, firstToken] = await api.listOperations(SENDER, {
        minHeight: 0,
        limit,
        order: "asc",
      });

      // Then - first page should have results and a cursor for the next page
      expect(firstPageOps.length).toBeGreaterThan(0);
      expect(firstPageOps.length).toBeLessThanOrEqual(limit);
      expect(firstToken).not.toBe("");

      // When - fetch second page using the cursor
      const [secondPageOps, secondToken] = await api.listOperations(SENDER, {
        minHeight: 0,
        limit,
        order: "asc",
        lastPagingToken: firstToken,
      });

      // Then - second page should also have results
      expect(secondPageOps.length).toBeGreaterThan(0);
      expect(secondPageOps.length).toBeLessThanOrEqual(limit);

      // Verify no overlap between pages (operation ids should be distinct)
      const firstPageIds = new Set(firstPageOps.map(op => op.id));
      for (const op of secondPageOps) {
        expect(firstPageIds.has(op.id)).toBe(false);
      }

      // Second page cursor should differ from the first (more pages or empty when done)
      expect(secondToken).not.toBe(firstToken);
    });
  });

  describe("craftTransaction", () => {
    // Zero address - always valid for crafting (though transaction will fail on broadcast)
    const RECIPIENT = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

    it("returns a crafted transaction for native ALGO transfer", async () => {
      // When
      const { transaction, details } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000n, // 1 ALGO
      });

      // Then
      expect(transaction.length).toBeGreaterThan(0);
      // Transaction should be hex encoded
      expect(transaction).toMatch(/^[0-9a-f]+$/i);
      expect(details).not.toBeUndefined();
    });

    it("uses custom fees when provided", async () => {
      // Given
      const customFees = 2000n;

      // When
      const { transaction } = await api.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 1000000n,
        },
        { value: customFees },
      );

      // Then
      expect(transaction.length).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction ASA tokens", () => {
    // Zero address - always valid for crafting
    const RECIPIENT = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
    // USDC on Algorand mainnet - Asset ID 31566704
    const USDC_ASSET_ID = "31566704";
    // Another well-known token: Tether USDt - Asset ID 312769
    const USDT_ASSET_ID = "312769";

    it("returns a crafted transaction for ASA token transfer", async () => {
      // When
      const { transaction, details } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000n, // 1 USDC (6 decimals)
      });

      // Then
      expect(transaction.length).toBeGreaterThan(0);
      // Transaction should be hex encoded
      expect(transaction).toMatch(/^[0-9a-f]+$/i);
      expect(details).not.toBeUndefined();
      // ASA transactions should have asset transfer specific fields
      expect(details.txPayload).not.toBeUndefined();
    });

    it("crafts ASA transfer with custom fees", async () => {
      // Given
      const customFees = 2000n;

      // When
      const { transaction, details } = await api.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "asa", assetReference: USDC_ASSET_ID },
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 500000n,
        },
        { value: customFees },
      );

      // Then
      expect(transaction.length).toBeGreaterThan(0);
      expect(details.txPayload).not.toBeUndefined();
    });

    it("estimates fees then crafts ASA transaction with estimated fees", async () => {
      // Given
      const transactionIntent = {
        intentType: "transaction" as const,
        asset: { type: "asa" as const, assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 250000n, // 0.25 USDC
      };

      // When - First estimate fees
      const feeEstimate = await api.estimateFees(transactionIntent);

      // Then - Verify fee estimate is reasonable
      expect(feeEstimate.value).toBeGreaterThanOrEqual(1000n);

      // When - Use estimated fees to craft transaction
      const { transaction, details } = await api.craftTransaction(transactionIntent, feeEstimate);

      // Then - Verify transaction was crafted
      expect(transaction.length).toBeGreaterThan(0);
      expect(transaction).toMatch(/^[0-9a-f]+$/i);
      expect(details).not.toBeUndefined();
      expect(details.txPayload).not.toBeUndefined();
    });

    it("crafts ASA transfer with zero amount (opt-in style)", async () => {
      // When - sending 0 amount to self is how opt-in works
      const { transaction, details } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDT_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: SENDER, // Self-transfer
        amount: 0n,
      });

      // Then
      expect(transaction.length).toBeGreaterThan(0);
      expect(transaction).toMatch(/^[0-9a-f]+$/i);
      expect(details.txPayload).not.toBeUndefined();
    });

    it("crafts ASA transfer with memo", async () => {
      // When
      const { transaction, details } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 100000n,
        memo: { type: "string", kind: "note", value: "ASA transfer test" },
      });

      // Then
      expect(transaction).not.toBeUndefined();
      expect(transaction.length).toBeGreaterThan(0);
      expect(details.txPayload).not.toBeUndefined();
    });

    it("crafts different ASA tokens with different asset IDs", async () => {
      // When - craft USDC transfer
      const { transaction: usdcTx } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000n,
      });

      // When - craft USDT transfer
      const { transaction: usdtTx } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDT_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000n,
      });

      // Then - transactions should be different (different asset IDs)
      expect(usdcTx).not.toBe(usdtTx);
      expect(usdcTx.length).toBeGreaterThan(0);
      expect(usdtTx.length).toBeGreaterThan(0);
    });
  });

  describe("unsupported methods", () => {
    it("getBlock throws not supported error", () => {
      expect(() => api.getBlock(100)).toThrow("getBlock is not supported for Algorand");
    });

    it("getSequence throws not applicable error", () => {
      expect(() => api.getSequence(SENDER)).toThrow("getSequence is not applicable for Algorand");
    });

    it("getStakes throws not supported error", () => {
      expect(() => api.getStakes(SENDER)).toThrow("getStakes is not supported for Algorand");
    });

    it("getRewards throws not supported error", () => {
      expect(() => api.getRewards(SENDER)).toThrow("getRewards is not supported for Algorand");
    });

    it("getValidators throws not supported error", () => {
      expect(() => api.getValidators()).toThrow("getValidators is not supported for Algorand");
    });
  });
});

describe("Algorand Api (testnet)", () => {
  // Testnet endpoints from Algonode
  const api = createApi({
    node: "https://testnet-api.algonode.cloud/v2",
    indexer: "https://testnet-idx.algonode.cloud/v2",
  });

  // Zero address - valid for testing
  const TESTNET_ADDRESS = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

  describe("lastBlock", () => {
    it("returns last block info from testnet", async () => {
      // When
      const result = await api.lastBlock();

      // Then
      expect(result.height).toBeGreaterThan(0);
    });
  });

  describe("estimateFees", () => {
    it("returns minimum fee on testnet", async () => {
      // When
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: TESTNET_ADDRESS,
        amount: 1000000n,
        recipient: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
      });

      // Then
      expect(result.value).toBeGreaterThanOrEqual(1000n);
    });
  });
});
