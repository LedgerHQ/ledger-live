import { isTransactionConfirmed } from "./isTransactionConfirmed";
import wallet, { type BitcoinLikeWallet } from "@ledgerhq/wallet-btc/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { getBoundWalletAccount } from "../coinConfig";

jest.mock("@ledgerhq/wallet-btc/index", () => ({
  __esModule: true,
  default: {
    getAccountTxBlockHeight: jest.fn(),
  },
}));

jest.mock("../coinConfig", () => ({
  getBoundWalletAccount: jest.fn(),
}));

const mockedWallet = wallet as jest.Mocked<BitcoinLikeWallet>;
const mockedGetBoundWalletAccount = jest.mocked(getBoundWalletAccount);

describe("isTransactionConfirmed", () => {
  const walletAccount = {} as any;
  const boundWalletAccount = { bound: true } as any;
  const account = {
    type: "Account",
    bitcoinResources: { walletAccount },
  } as unknown as AccountLike;
  const txid = "test-tx-id";

  beforeEach(() => {
    mockedGetBoundWalletAccount.mockReturnValue({
      config: {} as any,
      walletAccount: boundWalletAccount,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when transaction exists and has a valid block height", async () => {
    mockedWallet.getAccountTxBlockHeight.mockResolvedValue(123456);

    const result = await isTransactionConfirmed({ account, hash: txid });

    expect(result).toBe(true);
    // looked up on the account bound to the configured explorer (a deserialized one has none)
    expect(mockedGetBoundWalletAccount).toHaveBeenCalledWith(account);
    expect(mockedWallet.getAccountTxBlockHeight).toHaveBeenCalledWith(boundWalletAccount, txid);
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

  it("returns false without a lookup when the account has no wallet-btc account", async () => {
    const result = await isTransactionConfirmed({
      account: { type: "Account" } as unknown as AccountLike,
      hash: txid,
    });

    expect(result).toBe(false);
    expect(mockedGetBoundWalletAccount).not.toHaveBeenCalled();
    expect(mockedWallet.getAccountTxBlockHeight).not.toHaveBeenCalled();
  });
});
