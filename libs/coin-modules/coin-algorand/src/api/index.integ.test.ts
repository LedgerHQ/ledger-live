import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { algorandDefaults } from "../config";
import { createApi } from ".";

describe("Algorand Api (mainnet)", () => {
  // Algorand Foundation address - a well-known address with transaction history
  const SENDER = "737777777777777777777777777777777777777777777777777UFEJ2CI";
  const mainnetConfig = {
    ...algorandDefaults.algorand,
    node: "https://algorand.coin.ledger.com/ps2/v2",
    indexer: "https://algorand.coin.ledger.com/idx2/v2",
  };
  const api = createApi();
  const context = { config: async () => mainnetConfig, logger: () => {} };

  describe("getBalance", () => {
    it("returns a balance for an existing address", async () => {
      // When
      const result = await api.getBalance(context, SENDER);

      // Then
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(0n);
      expect(result[0].locked).toBeGreaterThanOrEqual(0n);
    });

    it("returns balance with locked amount (minimum balance)", async () => {
      // When
      const result = await api.getBalance(context, SENDER);

      // Then
      // Algorand requires minimum balance of 0.1 ALGO (100000 microAlgos)
      expect(result[0].locked).toBeGreaterThanOrEqual(100000n);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await api.lastBlock(context);

      // Then
      expect(result.height).toBeGreaterThan(0);
      expect(typeof result.hash).toBe("string");
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info for a specific height", async () => {
      // Given - Get the current block height first
      const lastBlockInfo = await api.lastBlock(context);
      const targetHeight = lastBlockInfo.height - 10; // Get a block from 10 rounds ago

      // When
      const result = await api.getBlockInfo(context, targetHeight);

      // Then
      expect(result.height).toBe(targetHeight);
      expect(typeof result.hash).toBe("string");
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getBlock", () => {
    const HEIGHT = 66607655;

    it("returns a block with its hash and parent", async () => {
      const block = await api.getBlock(context, HEIGHT);

      expect(block.info).toEqual({
        height: HEIGHT,
        hash: "HY4BUR6N33YYKSYDIGIEVNHAZIWWPP5BCRM43BJNVZ6J56LW3DPA",
        time: new Date(1793724956000),
        parent: {
          height: HEIGHT - 1,
          hash: "2HMKHXWWPKZVB3MT4EU533YFCBWRYS6A56FXYHF43HAVO2EPP3JQ",
        },
      });
    });

    it("returns the proposer payout as a native transfer", async () => {
      const { transactions } = await api.getBlock(context, HEIGHT);

      expect(transactions).toContainEqual({
        hash: "XP32QCHC6EJJTMD2CWG6TP2HWGETGRI6XG7GBNOBE27TJVWGTSBA",
        failed: false,
        operations: [
          {
            type: "transfer",
            address: "Y76M3MSY6DKBRHBL7C3NNDXGS5IIMQVQVUAB6MP4XEMMGVF2QWNPL226CA",
            peer: "QNGQXHUFFMY6KOXBBJFYQHV6BN52YUANDRHPV4EMNANJJRPGMSR6M3GXQE",
            asset: { type: "native" },
            amount: -8181062n,
          },
          {
            type: "transfer",
            address: "QNGQXHUFFMY6KOXBBJFYQHV6BN52YUANDRHPV4EMNANJJRPGMSR6M3GXQE",
            peer: "Y76M3MSY6DKBRHBL7C3NNDXGS5IIMQVQVUAB6MP4XEMMGVF2QWNPL226CA",
            asset: { type: "native" },
            amount: 8181062n,
          },
        ],
        fees: 0n,
        feesPayer: "Y76M3MSY6DKBRHBL7C3NNDXGS5IIMQVQVUAB6MP4XEMMGVF2QWNPL226CA",
        details: { txType: "pay" },
      });
    });

    it("returns the asset transfers of inner transactions", async () => {
      const { transactions } = await api.getBlock(context, HEIGHT);

      const application = transactions.find(
        tx => tx.hash === "AWMUF4YGFNXUN6AUBMEDFJYUJ3ROK6OBQL27EGZVMTF7KAGCDW7A",
      );
      expect(application).toMatchObject({ fees: 1000n, details: { txType: "appl" } });
      expect(application?.operations).toContainEqual({
        type: "transfer",
        address: "TIGER63IT7F5HDLXJYLXRPXGWAT6JCLWCN7OJBR4VGYTFQTPDNCKZHCDAU",
        peer: "JP3ENKDQC2BOYRMLFGKBS7RB2IVNF7VNHCFHVTRNHOENRQ6R4UN7MCNXPI",
        asset: { type: "asa", assetReference: "1284444444" },
        amount: 13107200n,
      });
    });

    it("returns the same block info as lastBlock for the latest round", async () => {
      const latest = await api.lastBlock(context);

      const { info } = await getIndexedBlock(latest.height);

      expect(info).toEqual(latest);
    });

    it("rejects a round that does not exist yet", async () => {
      await expect(api.getBlock(context, 999999999)).rejects.toThrow(
        "failed to retrieve information from the ledger",
      );
    });
  });

  // The indexer can lag a few rounds behind the node that gave the latest round
  async function getIndexedBlock(height: number, attempts = 10): ReturnType<typeof api.getBlock> {
    try {
      return await api.getBlock(context, height);
    } catch (error) {
      if (attempts <= 1 || !String(error).includes("is not indexed yet")) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getIndexedBlock(height, attempts - 1);
    }
  }

  describe("estimateFees", () => {
    it("returns estimated fees", async () => {
      // When
      const result = await api.estimateFees(context, {
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
      const result = await api.estimateFees(context, {
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
      const { items, next } = await api.listOperations(context, SENDER, {
        minHeight: 0,
        order: "desc",
      });

      // Then
      expect(items.length).toBeGreaterThan(0);
      expect(typeof next).toBe("string");

      // Verify operation structure
      const op = items[0];
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
      const { items } = await api.listOperations(context, SENDER, {
        minHeight: 0,
        order: "asc",
      });

      // Then
      if (items.length > 1) {
        // Check ascending order by block height
        for (let i = 1; i < items.length; i++) {
          expect(items[i].tx.block.height).toBeGreaterThanOrEqual(items[i - 1].tx.block.height);
        }
      }
    });

    it("paginates across at least two pages", async () => {
      // Given - use a small limit to force pagination
      const limit = 5;

      // When - fetch first page
      const { items: firstPageOps, next: firstToken } = await api.listOperations(context, SENDER, {
        minHeight: 0,
        limit,
        order: "asc",
      });

      // Then - first page should have results and a cursor for the next page
      expect(firstPageOps.length).toBeGreaterThan(0);
      expect(firstPageOps.length).toBeLessThanOrEqual(limit);
      expect(firstToken).not.toBe("");

      // When - fetch second page using the cursor
      const { items: secondPageOps, next: secondToken } = await api.listOperations(
        context,
        SENDER,
        {
          minHeight: 0,
          limit,
          order: "asc",
          cursor: firstToken,
        },
      );

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
      const { transaction, details } = await api.craftTransaction(context, {
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
        context,
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
      const { transaction, details } = await api.craftTransaction(context, {
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
        context,
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
      const feeEstimate = await api.estimateFees(context, transactionIntent);

      // Then - Verify fee estimate is reasonable
      expect(feeEstimate.value).toBeGreaterThanOrEqual(1000n);

      // When - Use estimated fees to craft transaction
      const { transaction, details } = await api.craftTransaction(
        context,
        transactionIntent,
        feeEstimate,
      );

      // Then - Verify transaction was crafted
      expect(transaction.length).toBeGreaterThan(0);
      expect(transaction).toMatch(/^[0-9a-f]+$/i);
      expect(details).not.toBeUndefined();
      expect(details.txPayload).not.toBeUndefined();
    });

    it("crafts ASA transfer with zero amount (opt-in style)", async () => {
      // When - sending 0 amount to self is how opt-in works
      const { transaction, details } = await api.craftTransaction(context, {
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
      const { transaction, details } = await api.craftTransaction(context, {
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
      const { transaction: usdcTx } = await api.craftTransaction(context, {
        intentType: "transaction",
        asset: { type: "asa", assetReference: USDC_ASSET_ID },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000n,
      });

      // When - craft USDT transfer
      const { transaction: usdtTx } = await api.craftTransaction(context, {
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
    // The module omits these capabilities; the resolver's `withDefaults` is what answers for them,
    // which is why the message is the framework's generic one.
    const resolved = withDefaults(createApi());

    it("getNextSequence throws not supported error", () => {
      expect(() => resolved.getNextSequence(context, SENDER)).toThrow(
        "getNextSequence is not supported",
      );
    });

    it("getStakes throws not supported error", () => {
      expect(() => resolved.getStakes(context, SENDER)).toThrow("getStakes is not supported");
    });

    it("getRewards throws not supported error", () => {
      expect(() => resolved.getRewards(context, SENDER)).toThrow("getRewards is not supported");
    });

    it("getValidators throws not supported error", () => {
      expect(() => resolved.getValidators(context)).toThrow("getValidators is not supported");
    });
  });
});

describe("Algorand Api (testnet)", () => {
  // Testnet endpoints from Algonode
  const api = createApi();
  const testnetConfig = {
    ...algorandDefaults.algorand,
    node: "https://testnet-api.algonode.cloud/v2",
    indexer: "https://testnet-idx.algonode.cloud/v2",
  };
  const context = { config: async () => testnetConfig, logger: () => {} };
  // Zero address - valid for testing
  const TESTNET_ADDRESS = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";

  describe("lastBlock", () => {
    it("returns last block info from testnet", async () => {
      // When
      const result = await api.lastBlock(context);

      // Then
      expect(result.height).toBeGreaterThan(0);
    });
  });

  describe("estimateFees", () => {
    it("returns minimum fee on testnet", async () => {
      // When
      const result = await api.estimateFees(context, {
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
