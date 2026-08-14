import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { fetchAllTransitionsFromHeight } from "../network/utils";
import { getCalTokens, toBridgeOperation } from "../logic/utils";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("../logic/utils");

const mockFetch = jest.mocked(fetchAllTransitionsFromHeight);
const mockToBridgeOperation = jest.mocked(toBridgeOperation);
const mockGetCalTokens = jest.mocked(getCalTokens);

const mockConfig = getMockedConfig("mainnet");
const mockConfigWithTokens = { ...mockConfig, enableTokens: true };
const mockTokenCurrency = getMockedTokenCurrency();

describe("bridge/listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalTokens.mockResolvedValue(new Map());
  });

  it("should map every public transaction to a bridge operation", async () => {
    const mockTx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
    const mockTx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 101 });
    const mockOp1 = getMockedOperation({ id: "op1", blockHeight: 100 });
    const mockOp2 = getMockedOperation({ id: "op2", blockHeight: 101 });

    mockFetch.mockResolvedValue([mockTx1, mockTx2]);
    mockToBridgeOperation.mockReturnValueOnce(mockOp1).mockReturnValueOnce(mockOp2);

    const result = await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0, order: "asc" },
    });

    expect(mockFetch).toHaveBeenCalledWith({
      config: mockConfig,
      address: mockAddress,
      minBlockHeight: 0,
      order: "asc",
    });
    expect(result.operations).toEqual([mockOp1, mockOp2]);
    expect(result.tokenOperations).toEqual([]);
    expect(result.calTokens).toEqual(new Map());
  });

  // Regression guard: the coin-module surface normalises transitions to tx granularity, the bridge
  // must not. Collapsing here would renumber and drop already-persisted operations.
  it("should keep one operation per transition row of a multi-transition transaction", async () => {
    const firstTransition = getMockedTransaction({
      transaction_id: "tx1",
      transition_id: "au1a",
      program_id: "credits.aleo",
    });
    const secondTransition = getMockedTransaction({
      transaction_id: "tx1",
      transition_id: "au1b",
      program_id: MOCK_TOKEN_PROGRAM_ID,
    });
    const firstOp = getMockedOperation({ id: "op1", hash: "tx1" });
    const secondOp = getMockedOperation({ id: "op2", hash: "tx1" });

    mockFetch.mockResolvedValue([firstTransition, secondTransition]);
    mockToBridgeOperation.mockReturnValueOnce(firstOp).mockReturnValueOnce(secondOp);

    const result = await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0 },
    });

    expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
    expect(result.operations).toEqual([firstOp, secondOp]);
  });

  it("should skip the CAL lookup when tokens are disabled", async () => {
    const mockTx = getMockedTransaction({ transaction_id: "tx1" });

    mockFetch.mockResolvedValue([mockTx]);
    mockToBridgeOperation.mockReturnValue(getMockedOperation({ id: "op1" }));

    await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0 },
    });

    expect(mockGetCalTokens).not.toHaveBeenCalled();
    expect(mockToBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      mockTx,
      mockAddress,
      false,
    );
  });

  it("should return empty operations when no transactions found", async () => {
    mockFetch.mockResolvedValue([]);

    const result = await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0 },
    });

    expect(result.operations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
    expect(result.calTokens).toEqual(new Map());
  });

  it("should forward the pagination options untouched", async () => {
    mockFetch.mockResolvedValue([]);

    await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 1000, cursor: "500", limit: 20, order: "desc" },
    });

    expect(mockFetch).toHaveBeenCalledWith({
      config: mockConfig,
      address: mockAddress,
      minBlockHeight: 1000,
      // The stored block is already synced, so resuming after the whole of it is what sync wants.
      cursor: { blockNumber: 500 },
      order: "desc",
    });
  });

  describe("with tokens enabled", () => {
    it("should split token operations from coin operations", async () => {
      const tokenTx = getMockedTransaction({
        transaction_id: "token-tx",
        program_id: MOCK_TOKEN_PROGRAM_ID,
      });
      const nativeTx = getMockedTransaction({
        transaction_id: "native-tx",
        program_id: "credits.aleo",
      });
      const tokenOp = getMockedOperation({ id: "token-op" });
      const nativeOp = getMockedOperation({ id: "native-op" });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      mockFetch.mockResolvedValue([tokenTx, nativeTx]);
      mockGetCalTokens.mockResolvedValue(calTokens);
      mockToBridgeOperation.mockImplementation((_ledgerAccountId, rawTx) =>
        rawTx.program_id === MOCK_TOKEN_PROGRAM_ID ? tokenOp : nativeOp,
      );

      const result = await listOperations({
        config: mockConfigWithTokens,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0, order: "asc" },
      });

      expect(mockGetCalTokens).toHaveBeenCalledWith({
        currencyId: mockCurrency.id,
        programNames: [MOCK_TOKEN_PROGRAM_ID, "credits.aleo"],
      });
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        1,
        mockLedgerAccountId,
        tokenTx,
        mockAddress,
        true,
      );
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        2,
        mockLedgerAccountId,
        nativeTx,
        mockAddress,
        false,
      );
      expect(result.operations).toEqual([tokenOp, nativeOp]);
      expect(result.tokenOperations).toEqual([tokenOp]);
      expect(result.calTokens).toEqual(calTokens);
    });

    // A transaction can touch two token programs across its transitions; each needs its own
    // operation so both sub-accounts get one.
    it("should emit a token operation per program when one transaction touches several", async () => {
      const secondProgramId = "usad_stablecoin.aleo";
      const secondTokenCurrency = getMockedTokenCurrency({
        id: TokenCurrencyIdSchema.parse("aleo/token/usad_stablecoin.aleo"),
        contractAddress: secondProgramId,
        ticker: "USAD",
      });
      const firstTransition = getMockedTransaction({
        transaction_id: "tx1",
        transition_id: "au1a",
        program_id: MOCK_TOKEN_PROGRAM_ID,
      });
      const secondTransition = getMockedTransaction({
        transaction_id: "tx1",
        transition_id: "au1b",
        program_id: secondProgramId,
      });
      const firstOp = getMockedOperation({ id: "op-1", hash: "tx1" });
      const secondOp = getMockedOperation({ id: "op-2", hash: "tx1" });

      mockFetch.mockResolvedValue([firstTransition, secondTransition]);
      mockGetCalTokens.mockResolvedValue(
        new Map([
          [MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency],
          [secondProgramId, secondTokenCurrency],
        ]),
      );
      mockToBridgeOperation.mockReturnValueOnce(firstOp).mockReturnValueOnce(secondOp);

      const result = await listOperations({
        config: mockConfigWithTokens,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.tokenOperations).toEqual([firstOp, secondOp]);
    });

    it("should not populate tokenOperations when CAL returns no matching tokens", async () => {
      const unknownTokenTx = getMockedTransaction({
        transaction_id: "unknown-tx",
        program_id: "unknown_token.aleo",
      });
      const mockOp = getMockedOperation({ id: "unknown-op" });

      mockFetch.mockResolvedValue([unknownTokenTx]);
      mockGetCalTokens.mockResolvedValue(new Map());
      mockToBridgeOperation.mockReturnValue(mockOp);

      const result = await listOperations({
        config: mockConfigWithTokens,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.operations).toEqual([mockOp]);
      expect(result.tokenOperations).toEqual([]);
    });

    it("should include every token operation when several CAL tokens are present", async () => {
      const secondProgramId = "usad_stablecoin.aleo";
      const secondTokenCurrency = getMockedTokenCurrency({
        id: TokenCurrencyIdSchema.parse("aleo/token/usad_stablecoin.aleo"),
        contractAddress: secondProgramId,
        ticker: "USAD",
      });
      const tx1 = getMockedTransaction({
        transaction_id: "tx-1",
        program_id: MOCK_TOKEN_PROGRAM_ID,
      });
      const tx2 = getMockedTransaction({ transaction_id: "tx-2", program_id: secondProgramId });
      const op1 = getMockedOperation({ id: "op-1", hash: "tx-1" });
      const op2 = getMockedOperation({ id: "op-2", hash: "tx-2" });

      mockFetch.mockResolvedValue([tx1, tx2]);
      mockGetCalTokens.mockResolvedValue(
        new Map([
          [MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency],
          [secondProgramId, secondTokenCurrency],
        ]),
      );
      mockToBridgeOperation.mockReturnValueOnce(op1).mockReturnValueOnce(op2);

      const result = await listOperations({
        config: mockConfigWithTokens,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.tokenOperations).toEqual([op1, op2]);
    });
  });
});
