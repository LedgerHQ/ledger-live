import { isAccountDelegating } from "../families/tezos/bakers";
import {
  BitcoinAccount,
  initialBitcoinResourcesValue,
} from "../families/bitcoin/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { TronAccount } from "../families/tron/types";
import { CosmosAccount } from "../families/cosmos/types";
import {
  getMainAccount,
  getAccountName,
  getAccountCurrency,
  getAccountUnit,
  getFeesCurrency,
  getFeesUnit,
  getAccountSpendableBalance,
  isAccountEmpty as commonIsAccountEmpty,
  areAllOperationsLoaded,
  isAccountBalanceSignificant,
  clearAccount as commonClearAccount,
  findSubAccountById,
  listSubAccounts,
  FlattenAccountsOptions,
  flattenAccounts,
  shortAddressPreview,
  isAccountBalanceUnconfirmed,
  isUpToDateAccount,
  makeEmptyTokenAccount,
  accountWithMandatoryTokens,
  withoutToken,
  findTokenAccountByCurrency,
  isAccount,
  isTokenAccount,
  isChildAccount,
  isSubAccount,
  getParentAccount,
} from "@ledgerhq/coin-framework/account/helpers";

// FIXME Remove this redundant export and import all from coin-framework
export {
  getMainAccount,
  getAccountName,
  getAccountCurrency,
  getAccountUnit,
  getFeesCurrency,
  getFeesUnit,
  getAccountSpendableBalance,
  areAllOperationsLoaded,
  isAccountBalanceSignificant,
  findSubAccountById,
  listSubAccounts,
  FlattenAccountsOptions,
  flattenAccounts,
  shortAddressPreview,
  isAccountBalanceUnconfirmed,
  isUpToDateAccount,
  makeEmptyTokenAccount,
  accountWithMandatoryTokens,
  withoutToken,
  findTokenAccountByCurrency,
  isAccount,
  isTokenAccount,
  isChildAccount,
  isSubAccount,
  getParentAccount,
};

export const isAccountEmpty = (a: AccountLike): boolean => {
  if (a.type === "Account" && a.currency.family === "tron") {
    const tronAcc = a as TronAccount;
    // FIXME: here we compared a BigNumber to a number, would always return false
    return (
      tronAcc.tronResources && tronAcc.tronResources.bandwidth.freeLimit.eq(0)
    );
  }

  return commonIsAccountEmpty(a);
};

// in future, could be a per currency thing
// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T extends AccountLike>(account: T): T {
  return commonClearAccount(account, (account: Account) => {
    if (account.currency.family === "tron") {
      const tronAcc = account as TronAccount;
      tronAcc.tronResources = {
        ...tronAcc.tronResources,
        cacheTransactionInfoById: {},
      };
    }
    if (account.currency.family === "bitcoin") {
      (account as BitcoinAccount).bitcoinResources =
        initialBitcoinResourcesValue;
    }
  });
}

export const getVotesCount = (
  account: AccountLike,
  parentAccount?: Account | null | undefined
): number => {
  const mainAccount = getMainAccount(account, parentAccount);

  // FIXME find a way to make it per family?
  switch (mainAccount.currency.family) {
    case "tezos":
      return isAccountDelegating(account) ? 1 : 0;
    case "tron":
      return (mainAccount as TronAccount)?.tronResources?.votes.length || 0;
    case "osmosis":
    case "cosmos":
      return (
        (mainAccount as CosmosAccount)?.cosmosResources?.delegations.length || 0
      );
    default:
      return 0;
  }
};
