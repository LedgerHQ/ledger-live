import BigNumber from "bignumber.js";
import { fetchAccountTransactionsFromHeight, resolveBondArguments } from "../network/utils";
import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getCalTokens, toBridgeOperation } from "./utils";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("./utils");

const mockFetchAccountTransactionsFromHeight = jest.mocked(fetchAccountTransactionsFromHeight);
const mockResolveBondArguments = jest.mocked(resolveBondArguments);
const mockToBridgeOperation = jest.mocked(toBridgeOperation);
const mockGetCalTokens = jest.mocked(getCalTokens);

const mockConfig = getMockedConfig("mainnet");
const mockConfigWithTokens = { ...mockConfig, enableTokens: true };
const mockConfigWithStaking = { ...mockConfig, enableStaking: true };
const mockTokenCurrency = getMockedTokenCurrency();

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalTokens.mockResolvedValue(new Map());
  });

  it("should fetch and parse transactions", async () => {
    const mockTx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
    const mockTx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 101 });
    const mockOp1 = getMockedOperation({ id: "op1", blockHeight: 100 });
    const mockOp2 = getMockedOperation({ id: "op2", blockHeight: 101 });

    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
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

    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
      config: mockConfig,
      address: mockAddress,
      fetchAllPages: true,
      minBlockHeight: 0,
      order: "asc",
    });
    expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
    expect(mockGetCalTokens).not.toHaveBeenCalled();
    expect(result.operations).toEqual([mockOp1, mockOp2]);
    expect(result.tokenOperations).toEqual([]);
    expect(result.nextCursor).toBe(mockTx2.block_number.toString());
    expect(result.calTokens).toEqual(new Map());
  });

  it("should build an operation per transaction when tokens are disabled", async () => {
    const mockTx = getMockedTransaction({ transaction_id: "tx1" });
    const mockOp = getMockedOperation({ id: "op1" });

    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [mockTx],
      nextCursor: null,
    });
    mockToBridgeOperation.mockReturnValue(mockOp);

    await listOperations({
      config: mockConfig,
      currencyId: mockCurrency.id,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      options: { minHeight: 0 },
    });

    expect(mockToBridgeOperation).toHaveBeenCalledTimes(1);
    expect(mockToBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      mockTx,
      mockAddress,
      undefined,
    );
    expect(mockGetCalTokens).not.toHaveBeenCalled();
  });

  it("should return empty operations when no transactions found", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

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

  describe("with tokens enabled", () => {
    it("should resolve CAL tokens and split token operations from coin operations", async () => {
      const tokenTx = getMockedTransaction({
        transaction_id: "token-tx",
        program_id: MOCK_TOKEN_PROGRAM_ID,
      });
      const nativeTx = getMockedTransaction({
        transaction_id: "native-tx",
        program_id: "credits.aleo",
      });
      const tokenOp = getMockedOperation({
        id: "token-op",
        extra: {
          functionId: "transfer_public",
          transactionType: "public",
          programId: MOCK_TOKEN_PROGRAM_ID,
        },
      });
      const nativeOp = getMockedOperation({ id: "native-op" });
      const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
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

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
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

      expect(mockToBridgeOperation).toHaveBeenCalledTimes(1);
      expect(mockToBridgeOperation).toHaveBeenCalledWith(
        mockLedgerAccountId,
        unknownTokenTx,
        mockAddress,
        undefined,
      );
      expect(result.operations).toEqual([mockOp]);
      expect(result.tokenOperations).toEqual([]);
    });

    it("should include multiple token operations when several CAL tokens are present", async () => {
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
      const calTokens = new Map([
        [MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency],
        [secondProgramId, secondTokenCurrency],
      ]);

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [tx1, tx2],
        nextCursor: null,
      });
      mockGetCalTokens.mockResolvedValue(calTokens);
      mockToBridgeOperation.mockReturnValueOnce(op1).mockReturnValueOnce(op2);

      const result = await listOperations({
        config: mockConfigWithTokens,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        1,
        mockLedgerAccountId,
        tx1,
        mockAddress,
        undefined,
      );
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        2,
        mockLedgerAccountId,
        tx2,
        mockAddress,
        undefined,
      );
      expect(result.tokenOperations).toEqual([op1, op2]);
    });
  });

  describe("bond argument enrichment", () => {
    const bondTx = getMockedTransaction({
      transaction_id: "bond-tx",
      function_id: TRANSACTION_TYPE.BOND_PUBLIC,
      sender_address: "",
      recipient_address: "",
      amount: 0,
    });

    it("should look up bond_public arguments and thread them into the operation", async () => {
      const transferTx = getMockedTransaction({ transaction_id: "transfer-tx" });
      const bondArguments = { validator: "aleo1validator", amount: new BigNumber(5000) };

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [bondTx, transferTx],
        nextCursor: null,
      });
      mockResolveBondArguments.mockResolvedValue(new Map([["bond-tx", bondArguments]]));
      mockToBridgeOperation.mockReturnValue(getMockedOperation({ id: "op1" }));

      await listOperations({
        config: mockConfigWithStaking,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(mockResolveBondArguments).toHaveBeenCalledTimes(1);
      expect(mockResolveBondArguments).toHaveBeenCalledWith({
        config: mockConfigWithStaking,
        transactions: [bondTx],
      });
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        1,
        mockLedgerAccountId,
        bondTx,
        mockAddress,
        bondArguments,
      );
      expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
        2,
        mockLedgerAccountId,
        transferTx,
        mockAddress,
        undefined,
      );
    });

    it.each([TRANSACTION_TYPE.UNBOND_PUBLIC, TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC])(
      "should not look anything up for %s",
      async functionId => {
        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [getMockedTransaction({ function_id: functionId })],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(getMockedOperation({ id: "op1" }));

        await listOperations({
          config: mockConfigWithStaking,
          currencyId: mockCurrency.id,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          options: { minHeight: 0 },
        });

        expect(mockResolveBondArguments).not.toHaveBeenCalled();
      },
    );

    it("should not look up a bond_public on another program", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [{ ...bondTx, program_id: MOCK_TOKEN_PROGRAM_ID }],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(getMockedOperation({ id: "op1" }));

      await listOperations({
        config: mockConfigWithStaking,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(mockResolveBondArguments).not.toHaveBeenCalled();
    });
  });

  describe("enableStaking gating", () => {
    const stakingTxs = [
      TRANSACTION_TYPE.BOND_PUBLIC,
      TRANSACTION_TYPE.UNBOND_PUBLIC,
      TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
    ].map(functionId =>
      getMockedTransaction({
        transaction_id: `${functionId}-tx`,
        function_id: functionId,
        sender_address: "",
        recipient_address: "",
        amount: 0,
      }),
    );
    const transferTx = getMockedTransaction({ transaction_id: "transfer-tx" });

    beforeEach(() => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [...stakingTxs, transferTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(getMockedOperation({ id: "op1" }));
    });

    it("should keep staking transactions out of the list when staking is disabled", async () => {
      const result = await listOperations({
        config: mockConfig,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.operations).toHaveLength(1);
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(1);
      expect(mockToBridgeOperation).toHaveBeenCalledWith(
        mockLedgerAccountId,
        transferTx,
        mockAddress,
        undefined,
      );
    });

    it("should not resolve bond arguments when staking is disabled", async () => {
      await listOperations({
        config: mockConfig,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(mockResolveBondArguments).not.toHaveBeenCalled();
    });

    it("should list staking transactions when staking is enabled", async () => {
      mockResolveBondArguments.mockResolvedValue(new Map());

      const result = await listOperations({
        config: mockConfigWithStaking,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.operations).toHaveLength(4);
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(4);
    });

    it("should keep a bond_public on another program regardless of the flag", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [{ ...stakingTxs[0], program_id: MOCK_TOKEN_PROGRAM_ID }],
        nextCursor: null,
      });

      const result = await listOperations({
        config: mockConfig,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: { minHeight: 0 },
      });

      expect(result.operations).toHaveLength(1);
    });
  });

  describe("options parameters", () => {
    it("should pass options parameters correctly to fetchAccountTransactionsFromHeight", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      await listOperations({
        config: mockConfig,
        currencyId: mockCurrency.id,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        options: {
          minHeight: 1000,
          cursor: "500",
          limit: 20,
          order: "desc",
        },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        config: mockConfig,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 1000,
        cursor: "500",
        limit: 20,
        order: "desc",
      });
    });
  });
});
