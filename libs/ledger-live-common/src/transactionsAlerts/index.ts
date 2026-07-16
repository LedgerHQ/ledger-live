import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";
import ChainwatchAccountManager from "./ChainwatchAccountManager";

const formatAccountsByCurrencies = (newAccounts: Account[], removedAccounts: Account[]) => {
  const accountsByCurrencies: Record<
    string,
    { newAccounts: Account[]; removedAccounts: Account[] }
  > = {};

  for (const newAccount of newAccounts) {
    if (!accountsByCurrencies[newAccount.currency.id]) {
      accountsByCurrencies[newAccount.currency.id] = { newAccounts: [], removedAccounts: [] };
    }
    accountsByCurrencies[newAccount.currency.id].newAccounts.push(newAccount);
  }
  for (const removedAccount of removedAccounts) {
    if (!accountsByCurrencies[removedAccount.currency.id]) {
      accountsByCurrencies[removedAccount.currency.id] = { newAccounts: [], removedAccounts: [] };
    }
    accountsByCurrencies[removedAccount.currency.id].removedAccounts.push(removedAccount);
  }

  return accountsByCurrencies;
};

const getAccountAddressKey = (account: Account) =>
  `${account.currency.id}:${account.freshAddress.toLowerCase()}`;

export const getSupportedChainsAccounts = (
  userId: string,
  chainwatchBaseUrl: string,
  supportedChains: ChainwatchNetwork[],
) => {
  return Promise.all(
    supportedChains.map(supportedChain => {
      const accountManager = new ChainwatchAccountManager(
        chainwatchBaseUrl,
        userId,
        supportedChain,
      );
      return accountManager.getChainwatchAccount();
    }),
  );
};

export const reconcileTransactionsAlertsAddresses = async (
  userId: string,
  chainwatchBaseUrl: string,
  supportedChains: ChainwatchNetwork[],
  accounts: Account[],
  previousAccounts: Account[],
) => {
  // Chainwatch subscriptions follow addresses, independently of local account ids.
  const accountsByAddress = new Map(
    accounts.map(account => [getAccountAddressKey(account), account]),
  );
  const accountsToRegister = Array.from(accountsByAddress.values());
  const accountAddressKeys = new Set(accountsByAddress.keys());
  const removedAccounts = previousAccounts.filter(
    account => !accountAddressKeys.has(getAccountAddressKey(account)),
  );
  const accountsByCurrencies = formatAccountsByCurrencies(accountsToRegister, removedAccounts);

  for (const [currencyId, currencyAccounts] of Object.entries(accountsByCurrencies)) {
    const network = supportedChains.find(
      (chain: ChainwatchNetwork) => chain.ledgerLiveId === currencyId,
    );
    if (network) {
      const accountManager = new ChainwatchAccountManager(chainwatchBaseUrl, userId, network);

      await accountManager.setupChainwatchAccount();
      await Promise.all([
        accountManager.registerNewAccountsAddresses(currencyAccounts.newAccounts),
        accountManager.removeAccountsAddresses(currencyAccounts.removedAccounts),
      ]);
    }
  }
};

export const deleteUserChainwatchAccounts = async (
  userId: string,
  chainwatchBaseUrl: string,
  supportedChains: ChainwatchNetwork[],
) => {
  for (const supportedChain of supportedChains) {
    const accountManager = new ChainwatchAccountManager(chainwatchBaseUrl, userId, supportedChain);

    const chainwatchAccount = await accountManager.getChainwatchAccount();
    if (chainwatchAccount) {
      await accountManager.removeChainwatchAccount();
    }
  }
};
