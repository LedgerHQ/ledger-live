import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { getEvmTransactionByHash } from "@ledgerhq/live-common/families/evm/getTransactionByHash";
import { AccountLike } from "@ledgerhq/types-live";

export function getTransactionByHash(accounts: AccountLike[]) {
  return async ({
    params,
  }: {
    params: {
      transactionHash: string;
      fromAccountId: string;
      SWAP_VERSION: string;
    };
  }): Promise<
    | {
        hash: string;
        blockHeight: number | undefined;
        blockHash: string | undefined;
        nonce: number;
        gasUsed: string;
        gasPrice: string;
        value: string;
      }
    | object
  > => {
    const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
    if (!realFromAccountId) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }

    const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
    if (!fromAccount) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }

    const fromParentAccount = getParentAccount(fromAccount, accounts);
    const mainAccount = getMainAccount(fromAccount, fromParentAccount);

    // `{}` while the transaction is not found yet; through the portfolio layer when it serves the chain.
    return getEvmTransactionByHash(mainAccount, params.transactionHash);
  };
}
