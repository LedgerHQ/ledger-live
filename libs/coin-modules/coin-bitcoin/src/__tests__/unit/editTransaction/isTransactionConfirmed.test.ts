import { isTransactionConfirmed } from "../../../editTransaction/isTransactionConfirmed";
import wallet from "../../../wallet-btc";
import { Account } from "../../../wallet-btc";

jest.mock("../../../wallet-btc", () => ({
  __esModule: true,
  default: {
    getAccountTransactions: jest.fn(),
  },
}));

const mockedWallet = wallet as jest.Mocked<typeof wallet>;

describe("isTransactionConfirmed", () => {
  const account = {} as Account;
  const txid = "test-tx-id";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when transaction exists and has a valid block height", async () => {
    mockedWallet.getAccountTransactions.mockResolvedValue({
      txs: [
        {
          hash: txid,
          block: { height: 123456 },
        },
      ],
    } as any);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(true);
    expect(mockedWallet.getAccountTransactions).toHaveBeenCalledWith(account);
  });

  it("returns false when transaction exists but has no block", async () => {
    mockedWallet.getAccountTransactions.mockResolvedValue({
      txs: [
        {
          hash: txid,
        },
      ],
    } as any);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });

  it("returns false when transaction exists but block height is 0", async () => {
    mockedWallet.getAccountTransactions.mockResolvedValue({
      txs: [
        {
          hash: txid,
          block: { height: 0 },
        },
      ],
    } as any);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });

  it("returns false when transaction is not found", async () => {
    mockedWallet.getAccountTransactions.mockResolvedValue({
      txs: [
        {
          hash: "other-tx-id",
          block: { height: 999 },
        },
      ],
    } as any);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });

  it("returns false when wallet throws a 'not found' error", async () => {
    mockedWallet.getAccountTransactions.mockRejectedValue(new Error("transaction not found"));

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });

  it("rethrows errors that are not 'not found'", async () => {
    mockedWallet.getAccountTransactions.mockRejectedValue(new Error("network failure"));

    await expect(isTransactionConfirmed(account, txid)).rejects.toThrow("network failure");
  });
});
