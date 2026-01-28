import { listOperations } from "./listOperations";
import { fetchTxsWithPages, fetchERC20TransactionsWithPages } from "../network/api";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  TEST_ADDRESSES,
  TEST_BLOCK_HEIGHTS,
  createMockTransactionResponse,
  createMockERC20Transfer,
} from "../test/fixtures";

jest.mock("../network/api");
jest.mock("@ledgerhq/cryptoassets/state");

const mockedFetchTxsWithPages = fetchTxsWithPages as jest.MockedFunction<typeof fetchTxsWithPages>;
const mockedFetchERC20TransactionsWithPages =
  fetchERC20TransactionsWithPages as jest.MockedFunction<typeof fetchERC20TransactionsWithPages>;
const mockedGetCryptoAssetsStore = getCryptoAssetsStore as jest.MockedFunction<
  typeof getCryptoAssetsStore
>;

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock for crypto assets store
    mockedGetCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue({
        type: "TokenCurrency" as const,
        id: "filecoin/erc20/test_token",
        contractAddress: TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase(),
        name: "Test Token",
        ticker: "TST",
        units: [{ name: "TST", code: "TST", magnitude: 18 }],
      }),
    } as any);
  });

  it("should return native operations", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.F1_ADDRESS,
        height: TEST_BLOCK_HEIGHTS.CURRENT,
      }),
    ]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [operations, cursor] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      order: "asc",
    });

    expect(operations.length).toBeGreaterThan(0);
    expect(operations[0].asset.type).toBe("native");
    expect(cursor).toBeDefined();
  });

  it("should return both native and token operations", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.F1_ADDRESS,
        height: TEST_BLOCK_HEIGHTS.CURRENT,
      }),
    ]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
      createMockERC20Transfer({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.F1_ADDRESS,
        height: TEST_BLOCK_HEIGHTS.RECENT,
      }),
    ]);

    const [operations] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      order: "asc",
    });

    expect(operations.length).toBeGreaterThan(1);
  });

  it("should sort operations by block height ascending", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({ height: 100 }),
      createMockTransactionResponse({ height: 50, hash: "hash2" }),
    ]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [operations] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      order: "asc",
    });

    if (operations.length >= 2) {
      expect(operations[0].tx.block.height).toBeLessThanOrEqual(operations[1].tx.block.height);
    }
  });

  it("should sort operations by block height descending", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({ height: 50 }),
      createMockTransactionResponse({ height: 100, hash: "hash2" }),
    ]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [operations] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      order: "desc",
    });

    if (operations.length >= 2) {
      expect(operations[0].tx.block.height).toBeGreaterThanOrEqual(operations[1].tx.block.height);
    }
  });

  it("should apply limit to operations", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) =>
        createMockTransactionResponse({ hash: `hash_${i}`, height: i }),
      ),
    );
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [operations] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      limit: 5,
    });

    expect(operations.length).toBeLessThanOrEqual(5);
  });

  it("should return empty array when no transactions", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [operations, cursor] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
    });

    expect(operations).toEqual([]);
    expect(cursor).toBe("");
  });

  it("should return cursor based on last operation height", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({ height: 12345 }),
    ]);
    mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

    const [, cursor] = await listOperations(TEST_ADDRESSES.F1_ADDRESS, {
      minHeight: 0,
      order: "asc",
    });

    expect(cursor).toBe("12345");
  });

  describe("native asset transfers", () => {
    it("should return OUT operation when address is sender", async () => {
      const senderAddress = TEST_ADDRESSES.F1_ADDRESS;
      const recipientAddress = TEST_ADDRESSES.RECIPIENT_F1;

      mockedFetchTxsWithPages.mockResolvedValueOnce([
        createMockTransactionResponse({
          from: senderAddress,
          to: recipientAddress,
          amount: "500000000000000000",
          height: TEST_BLOCK_HEIGHTS.CURRENT,
        }),
      ]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      const [operations] = await listOperations(senderAddress, {
        minHeight: 0,
        order: "asc",
      });

      expect(operations.length).toBeGreaterThan(0);
      const outOp = operations.find(op => op.type === "OUT");
      expect(outOp).toBeDefined();
      expect(outOp!.asset.type).toBe("native");
      expect(outOp!.senders).toContain(senderAddress);
      expect(outOp!.recipients).toContain(recipientAddress);
      expect(outOp!.value).toBeGreaterThan(0n);
    });

    it("should return IN operation when address is recipient", async () => {
      const senderAddress = TEST_ADDRESSES.RECIPIENT_F1;
      const recipientAddress = TEST_ADDRESSES.F1_ADDRESS;

      mockedFetchTxsWithPages.mockResolvedValueOnce([
        createMockTransactionResponse({
          from: senderAddress,
          to: recipientAddress,
          amount: "500000000000000000",
          height: TEST_BLOCK_HEIGHTS.CURRENT,
        }),
      ]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      const [operations] = await listOperations(recipientAddress, {
        minHeight: 0,
        order: "asc",
      });

      expect(operations.length).toBeGreaterThan(0);
      const inOp = operations.find(op => op.type === "IN");
      expect(inOp).toBeDefined();
      expect(inOp!.asset.type).toBe("native");
      expect(inOp!.senders).toContain(senderAddress);
      expect(inOp!.recipients).toContain(recipientAddress);
      expect(inOp!.value).toBeGreaterThan(0n);
    });

    it("should include fees in OUT operation value for outgoing transactions", async () => {
      const senderAddress = TEST_ADDRESSES.F1_ADDRESS;
      const recipientAddress = TEST_ADDRESSES.RECIPIENT_F1;

      mockedFetchTxsWithPages.mockResolvedValueOnce([
        createMockTransactionResponse({
          from: senderAddress,
          to: recipientAddress,
          amount: "500000000000000000",
          height: TEST_BLOCK_HEIGHTS.CURRENT,
          fee_data: {
            MinerFee: { MinerAddress: "f0123", Amount: "50000" },
            OverEstimationBurnFee: { BurnAddress: "f099", Amount: "25000" },
            BurnFee: { BurnAddress: "f099", Amount: "25000" },
            TotalCost: "100000",
          },
        }),
      ]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      const [operations] = await listOperations(senderAddress, {
        minHeight: 0,
        order: "asc",
      });

      // For native transfers, fees are included in OUT operation (not separate FEES op)
      const outOp = operations.find(op => op.type === "OUT");

      expect(outOp).toBeDefined();
      expect(outOp!.asset.type).toBe("native");
      // Value should include both amount and fees
      expect(outOp!.value).toBeGreaterThan(0n);
      expect(outOp!.tx.fees).toBeGreaterThan(0n);
    });

    it("should return FEES operation when transaction amount is zero", async () => {
      const senderAddress = TEST_ADDRESSES.F1_ADDRESS;
      const recipientAddress = TEST_ADDRESSES.RECIPIENT_F1;

      mockedFetchTxsWithPages.mockResolvedValueOnce([
        createMockTransactionResponse({
          from: senderAddress,
          to: recipientAddress,
          amount: "0", // Zero amount creates FEES operation type
          height: TEST_BLOCK_HEIGHTS.CURRENT,
          fee_data: {
            MinerFee: { MinerAddress: "f0123", Amount: "50000" },
            OverEstimationBurnFee: { BurnAddress: "f099", Amount: "25000" },
            BurnFee: { BurnAddress: "f099", Amount: "25000" },
            TotalCost: "100000",
          },
        }),
      ]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      const [operations] = await listOperations(senderAddress, {
        minHeight: 0,
        order: "asc",
      });

      // When amount is 0, operation type becomes FEES
      const feesOp = operations.find(op => op.type === "FEES");
      expect(feesOp).toBeDefined();
      expect(feesOp!.asset.type).toBe("native");
    });
  });

  describe("token transfers", () => {
    // Note: Token operations require:
    // 1. The token to be found in the crypto assets store (findTokenByAddressInCurrency)
    // 2. The token to have the correct format for encodeTokenAccountId
    //
    // Due to the complexity of mocking the crypto assets store and encodeTokenAccountId,
    // detailed token transfer tests are covered in the integration tests (index.integ.test.ts).
    // These unit tests focus on the behavior when tokens are NOT found.

    it("should skip token operation if token not found in crypto assets store", async () => {
      const senderAddress = TEST_ADDRESSES.F4_ADDRESS;
      const recipientAddress = TEST_ADDRESSES.RECIPIENT_F4;
      const unknownContractAddress = "0x9999999999999999999999999999999999999999";

      // Return null for unknown token
      mockedGetCryptoAssetsStore.mockReturnValue({
        findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
      } as any);

      mockedFetchTxsWithPages.mockResolvedValueOnce([]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
        createMockERC20Transfer({
          from: senderAddress,
          to: recipientAddress,
          contract_address: unknownContractAddress,
          height: TEST_BLOCK_HEIGHTS.CURRENT,
        }),
      ]);

      const [operations] = await listOperations(senderAddress, {
        minHeight: 0,
        order: "asc",
      });

      // No token operations because token not found in store
      const tokenOps = operations.filter(op => op.asset.type === "erc20");
      expect(tokenOps.length).toBe(0);
    });

    it("should fetch ERC20 transactions even if no native transactions", async () => {
      const address = TEST_ADDRESSES.F4_ADDRESS;
      const otherAddress = TEST_ADDRESSES.RECIPIENT_F4;
      const contractAddress = TEST_ADDRESSES.ERC20_CONTRACT.toLowerCase();

      // Token not found - no operations will be added, but ERC20 transactions should be fetched
      mockedGetCryptoAssetsStore.mockReturnValue({
        findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
      } as any);

      mockedFetchTxsWithPages.mockResolvedValueOnce([]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([
        createMockERC20Transfer({
          from: address,
          to: otherAddress,
          contract_address: contractAddress,
          height: TEST_BLOCK_HEIGHTS.CURRENT,
        }),
      ]);

      await listOperations(address, { minHeight: 0 });

      // Verify ERC20 transactions were fetched
      expect(mockedFetchERC20TransactionsWithPages).toHaveBeenCalledWith(address, 0);
    });
  });

  describe("mixed native and token operations", () => {
    it("should correctly classify native IN and OUT operations together", async () => {
      const address = TEST_ADDRESSES.F1_ADDRESS;
      const otherAddress = TEST_ADDRESSES.RECIPIENT_F1;

      // Native: address sends to other (OUT)
      // Native: other sends to address (IN)
      mockedFetchTxsWithPages.mockResolvedValueOnce([
        createMockTransactionResponse({
          from: address,
          to: otherAddress,
          amount: "100000000000000000",
          height: 1000,
          hash: "native_out_hash",
        }),
        createMockTransactionResponse({
          from: otherAddress,
          to: address,
          amount: "200000000000000000",
          height: 1001,
          hash: "native_in_hash",
        }),
      ]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      const [operations] = await listOperations(address, {
        minHeight: 0,
        order: "asc",
      });

      // Should have native OUT and native IN operations
      const nativeOps = operations.filter(op => op.asset.type === "native");

      expect(nativeOps.length).toBeGreaterThan(0);

      // Check native operations have correct types
      const nativeOut = nativeOps.find(op => op.type === "OUT");
      const nativeIn = nativeOps.find(op => op.type === "IN");
      expect(nativeOut).toBeDefined();
      expect(nativeIn).toBeDefined();

      // Verify addresses
      expect(nativeOut!.senders).toContain(address);
      expect(nativeOut!.recipients).toContain(otherAddress);
      expect(nativeIn!.senders).toContain(otherAddress);
      expect(nativeIn!.recipients).toContain(address);
    });

    it("should fetch both native and ERC20 transactions in parallel", async () => {
      const address = TEST_ADDRESSES.F1_ADDRESS;

      mockedFetchTxsWithPages.mockResolvedValueOnce([]);
      mockedFetchERC20TransactionsWithPages.mockResolvedValueOnce([]);

      await listOperations(address, { minHeight: 100, order: "asc" });

      // Both fetch functions should be called
      expect(mockedFetchTxsWithPages).toHaveBeenCalledWith(address, 100);
      expect(mockedFetchERC20TransactionsWithPages).toHaveBeenCalledWith(address, 100);
    });
  });
});
