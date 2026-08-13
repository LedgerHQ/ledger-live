import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { listPublicOperations } from "../logic/listPublicOperations";
import { getCalTokens, toBridgeOperation } from "../logic/utils";
import { listOperations } from "./listOperations";

jest.mock("../logic/listPublicOperations");
jest.mock("../logic/utils");

const mockListPublicOperations = jest.mocked(listPublicOperations);
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

    mockListPublicOperations.mockResolvedValue({
      transactions: [mockTx1, mockTx2],
      nextCursor: mockTx2.block_number.toString(),
    });
    mockToBridgeOperation.mockReturnValueOnce(mockOp1).mockReturnValueOnce(mockOp2);

    const result = await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0, order: "asc" },
    });

    expect(mockListPublicOperations).toHaveBeenCalledWith({
      config: mockConfig,
      address: mockAddress,
      minBlockHeight: 0,
      order: "asc",
    });
    expect(result.operations).toEqual([mockOp1, mockOp2]);
    expect(result.tokenOperations).toEqual([]);
    expect(result.nextCursor).toBe(mockTx2.block_number.toString());
    expect(result.calTokens).toEqual(new Map());
  });

  it("should skip the CAL lookup when tokens are disabled", async () => {
    const mockTx = getMockedTransaction({ transaction_id: "tx1" });

    mockListPublicOperations.mockResolvedValue({ transactions: [mockTx], nextCursor: null });
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
    mockListPublicOperations.mockResolvedValue({ transactions: [], nextCursor: null });

    const result = await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0 },
    });

    expect(result.operations).toEqual([]);
    expect(result.tokenOperations).toEqual([]);
    expect(result.nextCursor).toBeNull();
    expect(result.calTokens).toEqual(new Map());
  });

  it("should forward the pagination options untouched", async () => {
    mockListPublicOperations.mockResolvedValue({ transactions: [], nextCursor: null });

    await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 1000, cursor: "500", limit: 20, order: "desc" },
    });

    expect(mockListPublicOperations).toHaveBeenCalledWith({
      config: mockConfig,
      address: mockAddress,
      minBlockHeight: 1000,
      cursor: "500",
      limit: 20,
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

      mockListPublicOperations.mockResolvedValue({
        transactions: [tokenTx, nativeTx],
        nextCursor: null,
      });
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

    it("should not populate tokenOperations when CAL returns no matching tokens", async () => {
      const unknownTokenTx = getMockedTransaction({
        transaction_id: "unknown-tx",
        program_id: "unknown_token.aleo",
      });
      const mockOp = getMockedOperation({ id: "unknown-op" });

      mockListPublicOperations.mockResolvedValue({
        transactions: [unknownTokenTx],
        nextCursor: null,
      });
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

      mockListPublicOperations.mockResolvedValue({ transactions: [tx1, tx2], nextCursor: null });
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
