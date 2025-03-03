import { getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { AccountLike, SubAccount, SwapOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Dispatch } from "redux";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { convertToAtomicUnit } from "../utils";

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromParentAccountId?: string;
  toAccountId: string;
  fromAmount: string;
  toAmount?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
  providerRedirectURL: string;
  toNewTokenId: string;
  swapApiBase: string;
  estimatedFees: string;
  estimatedFeesUnit: string;
  swapId?: string;
};

export function saveSwapToHistory(accounts: AccountLike[], dispatch: Dispatch) {
  return async ({ params }: { params: { swap: SwapProps; transaction_id: string } }) => {
    const { swap, transaction_id } = params;

    console.info("\n\n\t saveSwapToHistory params ", params);

    if (
      !swap ||
      !transaction_id ||
      !swap.provider ||
      !swap.fromAmount ||
      !swap.toAmount ||
      !swap.swapId
    ) {
      return Promise.reject("Cannot save swap missing params");
    }
    const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
    const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
    if (!fromId || !toId) return Promise.reject("Accounts not found");
    const operationId = `${fromId}-${transaction_id}-OUT`;
    const fromAccount = accounts.find(acc => acc.id === fromId);
    const toAccount = accounts.find(acc => acc.id === toId);
    if (!fromAccount || !toAccount) {
      return Promise.reject(new Error(`accountId ${fromId} unknown`));
    }
    const accountId =
      fromAccount.type === "TokenAccount" ? getParentAccount(fromAccount, accounts).id : fromId;
    const swapOperation: SwapOperation = {
      status: "pending",
      provider: swap.provider,
      operationId,
      swapId: swap.swapId,
      receiverAccountId: toId,
      tokenId: toId,
      fromAmount: convertToAtomicUnit({
        amount: new BigNumber(swap.fromAmount),
        account: fromAccount,
      })!,
      toAmount: convertToAtomicUnit({
        amount: new BigNumber(swap.toAmount),
        account: toAccount,
      })!,
    };

    dispatch(
      updateAccountWithUpdater({
        accountId,
        updater: account => {
          if (fromId === account.id) {
            console.info("\n\n\t main fromId swapOperation ", fromId, swapOperation);

            return { ...account, swapHistory: [...account.swapHistory, swapOperation] };
          }

          console.info("\n\n\t subacc fromId swapOperation ", fromId, swapOperation);

          return {
            ...account,
            subAccounts: account.subAccounts?.map<SubAccount>((a: SubAccount) => {
              const subAccount = {
                ...a,
                swapHistory: [...a.swapHistory, swapOperation],
              };
              return a.id === fromId ? subAccount : a;
            }),
          };
        },
      }),
    );

    return Promise.resolve();
  };
}
