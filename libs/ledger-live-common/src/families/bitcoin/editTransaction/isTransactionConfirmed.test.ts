import { isTransactionConfirmed } from "./isTransactionConfirmed";
import wallet, { type BitcoinLikeWallet } from "@ledgerhq/wallet-btc/index";
import type { AccountLike } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/wallet-btc/index", () => ({
  __esModule: true,
  default: {
    getAccountTxBlockHeight: jest.fn(),
  },
}));

const mockedWallet = wallet as jest.Mocked<BitcoinLikeWallet>;

describe("isTransactionConfirmed", () => {
  const walletAccount = {} as any;
  const account = {
    type: "Account",
    bitcoinResources: { walletAccount },
  } as unknown as AccountLike;
  const txid = "test-tx-id";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when transaction exists and has a valid block height", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(123456);

    const result = await isTransactionConfirmed({ account, hash: txid });

    expect(result).toBe(true);
    expect(mockedWallet.getAccountTxBlockHeight).toHaveBeenCalledWith(walletAccount, txid);
  });

  it("returns false when transaction exists but has no block", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(0);

    const result = await isTransactionConfirmed({ account, hash: txid });

    expect(result).toBe(false);
  });

  it("returns false when transaction is not found", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(null);

    const result = await isTransactionConfirmed({ account, hash: txid });

    expect(result).toBe(false);
  });
});
