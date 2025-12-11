import { fetchAccountTransactionsFromHeight, parseOperation } from "../network/utils";
import { getMockedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");

const mockParseOperation = parseOperation as jest.MockedFunction<typeof parseOperation>;
const mockFetchAccountTransactionsFromHeight =
  fetchAccountTransactionsFromHeight as jest.MockedFunction<
    typeof fetchAccountTransactionsFromHeight
  >;

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and parse transactions successfully", async () => {
    const mockTx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
    const mockTx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 101 });
    const mockOp1 = getMockedOperation({ id: "op1", blockHeight: 100 });
    const mockOp2 = getMockedOperation({ id: "op2", blockHeight: 101 });

    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [mockTx1, mockTx2],
      nextCursor: mockTx2.block_number.toString(),
    });

    mockParseOperation.mockResolvedValueOnce(mockOp1).mockResolvedValueOnce(mockOp2);

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      fetchAllPages: false,
      pagination: {
        minHeight: 0,
        order: "asc",
      },
    });

    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
      currency: mockCurrency,
      address: mockAddress,
      fetchAllPages: false,
      minBlockHeight: 0,
      order: "asc",
    });
    expect(mockParseOperation).toHaveBeenCalledTimes(2);
    expect(result.operations).toEqual([mockOp1, mockOp2]);
    expect(result.nextCursor).toBe(mockTx2.block_number.toString());
  });

  it("should pass pagination parameters correctly", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      fetchAllPages: true,
      pagination: {
        minHeight: 1000,
        lastPagingToken: "500",
        limit: 20,
        order: "desc",
      },
    });

    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
    expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
      currency: mockCurrency,
      address: mockAddress,
      fetchAllPages: true,
      minBlockHeight: 1000,
      cursor: "500",
      limit: 20,
      order: "desc",
    });
  });

  it("should return empty operations when no transactions found", async () => {
    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [],
      nextCursor: null,
    });

    const result = await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      fetchAllPages: false,
      pagination: {
        minHeight: 0,
      },
    });

    expect(mockParseOperation).not.toHaveBeenCalled();
    expect(result.operations).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("should pass correct parameters to parseOperation for each transaction", async () => {
    const mockTx = getMockedTransaction({ transaction_id: "tx1" });
    const mockOp = getMockedOperation({ id: "op1" });

    mockFetchAccountTransactionsFromHeight.mockResolvedValue({
      transactions: [mockTx],
      nextCursor: "100",
    });

    mockParseOperation.mockResolvedValue(mockOp);

    await listOperations({
      currency: mockCurrency,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      fetchAllPages: false,
      pagination: {
        minHeight: 0,
      },
    });

    expect(mockParseOperation).toHaveBeenCalledTimes(1);
    expect(mockParseOperation).toHaveBeenCalledWith({
      currency: mockCurrency,
      rawTx: mockTx,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
    });
  });
});
