import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import type { AccountLike } from "@ledgerhq/types-live";
import { findMatchedContact } from "@ledgerhq/live-common/flows/send/recipient/utils/findMatchedContact";
import { selectContacts } from "@domain/entity-contact";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { truncateAddress } from "LLD/features/History/utils/truncateAddress";

export type AddressDisplayResult = {
  displayName: string;
  matchingAccount: AccountLike | undefined;
  accountName: string | undefined;
  contactName: string | undefined;
  contactAddressLabel: string | undefined;
};

const EMPTY_RESULT: AddressDisplayResult = {
  displayName: "",
  matchingAccount: undefined,
  accountName: undefined,
  contactName: undefined,
  contactAddressLabel: undefined,
};

function useMatchingAccount(address: string, currencyId: string): AccountLike | undefined {
  const allAccounts = useSelector(flattenAccountsSelector);

  return useMemo(() => {
    if (!address) return undefined;
    const normalizedAddress = address.toLowerCase();
    return allAccounts.find(acc => {
      if (acc.type !== "Account") return false;
      return acc.currency.id === currencyId && acc.freshAddress.toLowerCase() === normalizedAddress;
    });
  }, [allAccounts, address, currencyId]);
}

function useMatchingContact(address: string, currencyId: string) {
  const contacts = useSelector(selectContacts);

  return useMemo(
    () => (address ? findMatchedContact(contacts, address, currencyId) : undefined),
    [contacts, address, currencyId],
  );
}

export type UseAddressDisplayOptions = {
  /** When false, contact matches are ignored (no contact name nor address label). Defaults to true. */
  includeContacts?: boolean;
};

/**
 * Resolves the best display label for a blockchain address.
 * Priority: Ledger account name > contact name > truncated address.
 *
 * @param address - raw blockchain address
 * @param currencyId - main currency id (use parentCurrency.id for tokens)
 * @param options - set of options to configure the display
 */
export function useAddressDisplay(
  address: string,
  currencyId: string,
  options?: UseAddressDisplayOptions,
): AddressDisplayResult {
  const includeContacts = options?.includeContacts ?? true;
  const matchingAccount = useMatchingAccount(address, currencyId);
  const accountName = useMaybeAccountName(matchingAccount);
  const matchingContact = useMatchingContact(address, currencyId);

  return useMemo(() => {
    if (!address) return EMPTY_RESULT;

    const contact = includeContacts ? matchingContact : undefined;
    const contactName = contact?.contactName;
    const displayName = accountName ?? contactName ?? truncateAddress(address);

    return {
      displayName,
      matchingAccount,
      accountName,
      contactName,
      contactAddressLabel: contact?.addressLabel,
    };
  }, [address, matchingAccount, accountName, matchingContact, includeContacts]);
}
