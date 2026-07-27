import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";
import ChainwatchAccountManager from "./ChainwatchAccountManager";

const hexAddressPattern = /^0x[0-9a-f]+$/i;

export type TransactionsAlertsAddress = {
  currencyId: string;
  address: string;
};

export const getTransactionsAlertsAddressKey = (currencyId: string, address: string) =>
  `${currencyId}:${hexAddressPattern.test(address) ? address.toLowerCase() : address}`;

const getAddressKey = ({ currencyId, address }: TransactionsAlertsAddress) =>
  getTransactionsAlertsAddressKey(currencyId, address);

export const deduplicateTransactionsAlertsAddresses = (addresses: TransactionsAlertsAddress[]) =>
  Array.from(new Map(addresses.map(address => [getAddressKey(address), address])).values());

export const getTransactionsAlertsAddresses = (accounts: Account[]) =>
  deduplicateTransactionsAlertsAddresses(
    accounts
      .filter(account => account.freshAddress)
      .map(account => ({
        currencyId: account.currency.id,
        address: account.freshAddress,
      })),
  );

const formatAddressesByCurrencies = (
  newAddresses: TransactionsAlertsAddress[],
  removedAddresses: TransactionsAlertsAddress[],
) => {
  const addressesByCurrencies: Record<
    string,
    { newAddresses: TransactionsAlertsAddress[]; removedAddresses: TransactionsAlertsAddress[] }
  > = {};

  for (const newAddress of newAddresses) {
    if (!addressesByCurrencies[newAddress.currencyId]) {
      addressesByCurrencies[newAddress.currencyId] = { newAddresses: [], removedAddresses: [] };
    }
    addressesByCurrencies[newAddress.currencyId].newAddresses.push(newAddress);
  }
  for (const removedAddress of removedAddresses) {
    if (!addressesByCurrencies[removedAddress.currencyId]) {
      addressesByCurrencies[removedAddress.currencyId] = {
        newAddresses: [],
        removedAddresses: [],
      };
    }
    addressesByCurrencies[removedAddress.currencyId].removedAddresses.push(removedAddress);
  }

  return addressesByCurrencies;
};

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
  addresses: TransactionsAlertsAddress[],
  previousAddresses: TransactionsAlertsAddress[],
) => {
  const addressesToRegister = deduplicateTransactionsAlertsAddresses(addresses);
  const addressKeys = new Set(addressesToRegister.map(getAddressKey));
  const removedAddresses = deduplicateTransactionsAlertsAddresses(
    previousAddresses.filter(address => !addressKeys.has(getAddressKey(address))),
  );
  const addressesByCurrencies = formatAddressesByCurrencies(addressesToRegister, removedAddresses);

  for (const [currencyId, currencyAddresses] of Object.entries(addressesByCurrencies)) {
    const network = supportedChains.find(
      (chain: ChainwatchNetwork) => chain.ledgerLiveId === currencyId,
    );
    if (network) {
      const accountManager = new ChainwatchAccountManager(chainwatchBaseUrl, userId, network);

      if (currencyAddresses.newAddresses.length > 0) {
        await accountManager.setupChainwatchAccount();
      } else if (!(await accountManager.loadChainwatchAccount())) {
        continue;
      }
      await accountManager.removeAddresses(
        currencyAddresses.removedAddresses.map(({ address }) => address),
      );
      await accountManager.registerNewAddresses(
        currencyAddresses.newAddresses.map(({ address }) => address),
      );
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
