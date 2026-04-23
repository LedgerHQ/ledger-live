import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike } from "@ledgerhq/types-live";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { truncateAddress } from "LLD/features/History/utils/truncateAddress";

export type AddressDisplayResult = {
  displayName: string;
  matchingAccount: AccountLike | undefined;
  accountName: string | undefined;
};

const EMPTY_RESULT: AddressDisplayResult = {
  displayName: "",
  matchingAccount: undefined,
  accountName: undefined,
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

/**
 * Resolves the best display label for a blockchain address.
 * Priority: Ledger account name > truncated address.
 *
 * @param address - raw blockchain address
 * @param currencyId - main currency id (use parentCurrency.id for tokens)
 */
export function useAddressDisplay(address: string, currencyId: string): AddressDisplayResult {
  const matchingAccount = useMatchingAccount(address, currencyId);
  const accountName = useMaybeAccountName(matchingAccount);

  return useMemo(() => {
    if (!address) return EMPTY_RESULT;

    const displayName = accountName ?? truncateAddress(address);

    return { displayName, matchingAccount, accountName };
  }, [address, matchingAccount, accountName]);
}
