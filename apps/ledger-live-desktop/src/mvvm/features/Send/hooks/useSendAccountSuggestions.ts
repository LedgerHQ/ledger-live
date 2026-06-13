import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useContactsStore } from "~/renderer/contacts/hooks";
import type { ContactsWallet } from "~/renderer/contacts/types";

export type SendAccountSuggestion = Readonly<{
  /** Stable row key — the account id, or `registered:<name>` for wallet-only rows. */
  id: string;
  /**
   * The Ledger Live account backing this row (drives the balance column).
   * Absent for device-registered accounts with no app-side counterpart.
   */
  account?: Account;
  /** Display name (wallet store name, or the device-signed name). */
  name: string;
  /** The account's receive address. */
  address: string;
  /**
   * True when this name is signed with the Ledger device (a
   * `registerLedgerAccount` record exists in the contacts wallet) —
   * rendered as the shield-check badge next to the name.
   */
  signed: boolean;
  /** Currency for the squared crypto icon. */
  currencyId: string;
  ticker: string;
}>;

const normalizeAddress = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const matchesQuery = (query: string, name: string, address: string): boolean => {
  if (query.length === 0) return true;
  const nameNeedle = query.trim().toLowerCase();
  const addressNeedle = normalizeAddress(query);
  const addressKey = normalizeAddress(address);
  return (
    name.toLowerCase().startsWith(nameNeedle) ||
    (addressNeedle.length > 0 && addressKey.startsWith(addressNeedle))
  );
};

type RegisteredAccountsContext = Readonly<{
  /** Contacts wallet — its `accounts` map holds the device-signed names. */
  wallet: ContactsWallet;
  /** EVM chainId of the selected network (signed records are chain-scoped). */
  chainId: number;
}>;

/**
 * Pure builder for the "My accounts" recipient section — the user's own
 * accounts that can RECEIVE the selected asset, signed or not:
 *
 *  - Ledger Live accounts on the selected crypto's chain (for a token
 *    that's the parent chain — any Ethereum account can receive USDC),
 *    with the sending account excluded.
 *  - Each is marked `signed` when its name carries a device-signed
 *    `registerLedgerAccount` record (same name + chainId + derivation
 *    path matching as `SignedNameShield` in CryptoAddresses).
 *  - Device-registered accounts with NO app-side account are appended
 *    after them (signed, no balance), deduped by address.
 *  - Optionally narrowed by a name/address-prefix query.
 */
export const buildSendAccountSuggestions = (
  accounts: ReadonlyArray<Account>,
  getName: (account: Account) => string,
  currency: CryptoCurrency | TokenCurrency | null,
  currentMainAccountId: string | undefined,
  query: string,
  registered?: RegisteredAccountsContext,
): SendAccountSuggestion[] => {
  if (!currency) return [];
  // Recipient addresses live on the chain, so token sends list the parent
  // chain's accounts (any Ethereum account can receive USDC).
  const mainCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;

  const isSigned = (name: string, account: Account): boolean => {
    if (!registered) return false;
    const record = registered.wallet.accounts?.[name];
    if (!record) return false;
    return (
      record.chainId === registered.chainId && record.derivationPath === account.freshAddressPath
    );
  };

  const seenAddresses = new Set<string>();
  const senderAddress = accounts.find(a => a.id === currentMainAccountId)?.freshAddress;
  if (senderAddress) seenAddresses.add(normalizeAddress(senderAddress));

  const suggestions: SendAccountSuggestion[] = [];
  for (const account of accounts) {
    if (account.currency.id !== mainCurrency.id) continue;
    if (currentMainAccountId && account.id === currentMainAccountId) continue;
    const name = getName(account);
    if (!matchesQuery(query, name, account.freshAddress)) continue;
    seenAddresses.add(normalizeAddress(account.freshAddress));
    suggestions.push({
      id: account.id,
      account,
      name,
      address: account.freshAddress,
      signed: isSigned(name, account),
      currencyId: account.currency.id,
      ticker: account.currency.ticker,
    });
  }

  // Device-registered accounts the app doesn't hold (e.g. registered from
  // another seed/app via the L1 form): still the user's own, still
  // compatible — listed signed, without a balance column.
  if (registered) {
    for (const record of Object.values(registered.wallet.accounts ?? {})) {
      if (record.chainId !== registered.chainId) continue;
      const addressKey = normalizeAddress(record.addressHex);
      if (seenAddresses.has(addressKey)) continue;
      if (!matchesQuery(query, record.name, record.addressHex)) continue;
      seenAddresses.add(addressKey);
      suggestions.push({
        id: `registered:${record.name}`,
        name: record.name,
        address: `0x${addressKey}`,
        signed: true,
        currencyId: mainCurrency.id,
        ticker: mainCurrency.ticker,
      });
    }
  }

  return suggestions;
};

/**
 * Redux + contacts-store wrapper around `buildSendAccountSuggestions` for
 * the Recipient pickers (preview section + full "My accounts" list).
 */
export const useSendAccountSuggestions = (
  query: string,
  currency: CryptoCurrency | TokenCurrency | null,
  currentMainAccountId: string | undefined,
  chainId: number | undefined,
): SendAccountSuggestion[] => {
  const accounts = useSelector(accountsSelector);
  const walletState = useSelector(walletSelector);
  const { wallet, hydrated } = useContactsStore();

  return useMemo(
    () =>
      buildSendAccountSuggestions(
        accounts,
        account => accountNameWithDefaultSelector(walletState, account),
        currency,
        currentMainAccountId,
        query,
        hydrated && chainId !== undefined ? { wallet, chainId } : undefined,
      ),
    [
      accounts,
      walletState,
      currency,
      currentMainAccountId,
      query,
      hydrated,
      wallet,
      chainId,
    ],
  );
};
