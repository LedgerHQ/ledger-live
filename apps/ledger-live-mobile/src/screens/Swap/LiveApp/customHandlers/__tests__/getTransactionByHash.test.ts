import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getEvmTransactionByHash } from "@ledgerhq/live-common/families/evm/getTransactionByHash";
import { getTransactionByHash } from "../getTransactionByHash";

jest.mock(
  "@ledgerhq/live-common/families/evm/getTransactionByHash",
  () => ({ getEvmTransactionByHash: jest.fn() }),
  { virtual: true },
);

jest.mock("@ledgerhq/live-common/wallet-api/converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn((walletAccountId: string) =>
    walletAccountId === "unknown-wallet-id" ? undefined : walletAccountId,
  ),
}));

const account = genAccount("swap-get-transaction-by-hash", {
  currency: getCryptoCurrencyById("ethereum"),
});
const params = (fromAccountId: string) => ({
  transactionHash: "0xhash",
  fromAccountId,
  SWAP_VERSION: "2",
});

describe("getTransactionByHash", () => {
  beforeEach(() => jest.clearAllMocks());

  it("answers the transaction of the main account, as live-common reads it", async () => {
    const transaction = { hash: "0xhash", blockHeight: 12, blockHash: "0xblock", value: "1" };
    jest.mocked(getEvmTransactionByHash).mockResolvedValue(transaction);

    await expect(getTransactionByHash([account])({ params: params(account.id) })).resolves.toBe(
      transaction,
    );
    expect(getEvmTransactionByHash).toHaveBeenCalledWith(account, "0xhash");
  });

  it("refuses an account it does not know", async () => {
    await expect(
      getTransactionByHash([account])({ params: params("unknown-wallet-id") }),
    ).rejects.toThrow("accountId unknown-wallet-id unknown");
    await expect(getTransactionByHash([])({ params: params(account.id) })).rejects.toThrow(
      `accountId ${account.id} unknown`,
    );
    expect(getEvmTransactionByHash).not.toHaveBeenCalled();
  });
});
