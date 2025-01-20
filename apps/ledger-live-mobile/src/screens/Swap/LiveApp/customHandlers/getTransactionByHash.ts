import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { AccountLike } from "@ledgerhq/types-live";
import { getNodeApi } from "@ledgerhq/coin-evm/api/node/index";

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

    const nodeAPI = getNodeApi(mainAccount.currency);

    try {
      const tx = await nodeAPI.getTransaction(mainAccount.currency, params.transactionHash);
      return Promise.resolve(tx);
    } catch (error) {
      // not a real error, the node just didn't find the transaction yet
      return Promise.resolve({});
    }
  };
}
