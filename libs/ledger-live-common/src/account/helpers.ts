import { BitcoinAccount, initialBitcoinResourcesValue } from "@ledgerhq/coin-bitcoin/types";
import {
  clearAccount as commonClearAccount,
  isAccountEmpty as commonIsAccountEmpty,
  getMainAccount,
} from "@ledgerhq/coin-framework/account";
import { isAccountEmpty as isCosmosAccountEmpty } from "@ledgerhq/coin-cosmos/helpers";
import { isCosmosAccount, type CosmosAccount } from "@ledgerhq/coin-cosmos/types/index";
import {
  isTronAccount,
  isAccountEmpty as isTronAccountEmpty,
  type TronAccount,
} from "@ledgerhq/coin-tron/index";
import { isAccountEmpty as isVechainAccountEmpty } from "@ledgerhq/coin-vechain/index";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { isAccountDelegating } from "../families/tezos/staking";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { makeEmptyTokenAccount } from ".";

// TODO: remove this export and prefer import from root file.
export {
  accountWithMandatoryTokens,
  findTokenAccountByCurrency,
  flattenAccounts,
  getMainAccount,
  getAccountCurrency,
  getAccountSpendableBalance,
  getFeesCurrency,
  getFeesUnit,
  getParentAccount,
  isAccount,
  isAccountBalanceUnconfirmed,
  isTokenAccount,
  listSubAccounts,
  shortAddressPreview,
} from "@ledgerhq/coin-framework/account/index";

export const isAccountEmpty = (a: AccountLike): boolean => {
  if (a.type === "Account") {
    if (isCosmosAccount(a)) {
      return isCosmosAccountEmpty(a);
    }
    if (isTronAccount(a)) {
      return isTronAccountEmpty(a);
    }
    if (a.currency.family == "vechain") {
      return isVechainAccountEmpty(a);
    }
  }

  return commonIsAccountEmpty(a);
};

// in future, could be a per currency thing
// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T extends AccountLike>(account: T): T {
  // FIXME add in the coins bridge a way for a coin to define extra clean up functions to modularize this.
  return commonClearAccount(account, (account: Account) => {
    if (isTronAccount(account)) {
      account.tronResources = {
        ...account.tronResources,
        cacheTransactionInfoById: {},
      };
    }
    if (account.currency.family === "bitcoin") {
      (account as BitcoinAccount).bitcoinResources = initialBitcoinResourcesValue;
    }
  });
}

export const getVotesCount = (
  account: AccountLike,
  parentAccount?: Account | null | undefined,
): number => {
  const mainAccount = getMainAccount(account, parentAccount);

  // FIXME add this back in the coin bridge.
  switch (mainAccount.currency.family) {
    case "tezos":
      return isAccountDelegating(account) ? 1 : 0;
    case "tron":
      return (mainAccount as TronAccount)?.tronResources?.votes.length || 0;
    case "axelar":
    case "onomy":
    case "quicksilver":
    case "stride":
    case "persistence":
    case "stargaze":
    case "nyx":
    case "secret_network":
    case "sei_network":
    case "desmos":
    case "dydx":
    case "umee":
    case "binance_beacon_chain":
    case "osmosis":
    case "cosmos":
    case "coreum":
    case "mantra":
    case "crypto_org":
    case "xion":
    case "zenrock":
    case "babylon":
      return (mainAccount as CosmosAccount)?.cosmosResources?.delegations.length || 0;
    default:
      return 0;
  }
};

type AccountTuple = {
  account: Account;
  subAccount: TokenAccount | null;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean,
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter(account => account.currency.id === currency.parentCurrency.id)
      .map(account => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: TokenAccount) =>
                subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter(a => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }

  return allAccounts
    .filter(account => account.currency.id === currency.id)
    .map(account => ({
      account,
      subAccount: null,
    }))
    .filter(a => (hideEmpty ? a.account?.balance.gt(0) : true));
}
