import { isTransactionConfirmed } from "../../../editTransaction/isTransactionConfirmed";
import wallet, { type BitcoinLikeWallet } from "../../../wallet-btc";
import { Account } from "../../../wallet-btc";

jest.mock("../../../wallet-btc", () => ({
  __esModule: true,
  default: {
    getAccountTxBlockHeight: jest.fn(),
  },
}));

const mockedWallet = wallet as jest.Mocked<BitcoinLikeWallet>;

describe("isTransactionConfirmed", () => {
  const account = {} as Account;
  const txid = "test-tx-id";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when transaction exists and has a valid block height", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(123456);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(true);
    expect(mockedWallet.getAccountTxBlockHeight).toHaveBeenCalledWith(account, txid);
  });

  it("returns false when transaction exists but has no block", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(0);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });

  it("returns false when transaction is not found", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(null);

    const result = await isTransactionConfirmed(account, txid);

    expect(result).toBe(false);
  });
});
