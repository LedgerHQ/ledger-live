import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  RecentAddress as RecentAddressFromStore,
} from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo, useState } from "react";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useSendFlowData } from "../../../context/SendFlowContext";
import type { RecentAddress } from "../types";
import { normalizeLastUsedTimestamp } from "../utils/dateFormatter";
import { useAddressValidation } from "./useAddressValidation";
import { useRecipientSearchState } from "./useRecipientSearchState";

type UseRecipientAddressModalViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, ensName?: string, goToNextStep?: boolean) => void;
  recipientSupportsDomain: boolean;
}>;

export function useRecipientAddressModalViewModel({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain,
}: UseRecipientAddressModalViewModelProps) {
  const { recipientSearch, state } = useSendFlowData();
  const [refreshCounter, setRefreshCounter] = useState(0);

  const mainAccount = getMainAccount(account, parentAccount);

  const { result, isLoading } = useAddressValidation({
    searchValue: recipientSearch.value,
    currency,
    account,
    parentAccount,
    currentAccountId: mainAccount.id,
  });

  const allAccounts = useSelector(accountsSelector);
  const userAccountsForCurrency = useMemo(() => {
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const allowSelfTransfer = selfTransferPolicy === "free" || selfTransferPolicy === "warning";

    return allAccounts.filter(acc => {
      if (acc.id === mainAccount.id && !allowSelfTransfer) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, mainAccount.id]);

  const recentAddresses = useMemo(() => {
    const addressesWithMetadata = getRecentAddressesStore().getAddresses(
      currency.id,
    ) as unknown as RecentAddressFromStore[];
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    return addressesWithMetadata
      .filter(entry => {
        if (!entry?.address) return false;
        if (
          selfTransferPolicy === "impossible" &&
          entry.address.toLowerCase() === mainAccount.freshAddress.toLowerCase()
        ) {
          return false;
        }
        return true;
      })
      .map(entry => {
        const matchedAccount = userAccountsByAddress.get(entry.address.toLowerCase());
        const lastUsedTimestamp = normalizeLastUsedTimestamp(entry.lastUsed);
        const recentAddress: RecentAddress = {
          address: entry.address,
          currency,
          lastUsedAt: new Date(lastUsedTimestamp),
          name: entry.address,
          ensName: entry.ensName,
          isLedgerAccount: !!matchedAccount,
          accountId: matchedAccount?.id,
        };
        return recentAddress;
      });
    // refreshKey is used to force recalculation when addresses are removed from the store
    // even though it's not directly used in the computation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, refreshCounter, mainAccount.freshAddress, userAccountsForCurrency]);

  const hasSearchValue = recipientSearch.value.length > 0;
  const showInitialState = !hasSearchValue;

  const hasRecentAddresses = recentAddresses.length > 0;
  const hasUserAccounts = userAccountsForCurrency.length > 0;
  const showInitialEmptyState = showInitialState && !hasRecentAddresses && !hasUserAccounts;

  const hasMemo = sendFeatures.hasMemo(currency);
  const memoType = sendFeatures.getMemoType(currency);
  const memoTypeOptions = sendFeatures.getMemoOptions(currency);
  const memoDefaultOption = sendFeatures.getMemoDefaultOption(currency);
  const memoMaxLength = sendFeatures.getMemoMaxLength(currency);

  const hasMemoValidationError = useMemo(() => {
    if (!hasMemo) return false;
    return Boolean(state.transaction.status.errors.transaction);
  }, [hasMemo, state.transaction.status.errors.transaction]);

  const hasFilledMemo = useMemo(() => {
    if (!hasMemo) return true;
    const memo = state.recipient?.memo;
    if (!memo) return false;
    if (memo.type === "NO_MEMO") return true;
    return memo.value.length > 0;
  }, [hasMemo, state.recipient?.memo]);

  const handleRecentAddressSelect = useCallback(
    (address: RecentAddress) => {
      if (hasMemo) {
        recipientSearch.setValue(address.ensName ?? address.address);
      }

      onAddressSelected(address.address, address.ensName, !hasMemo);
    },
    [hasMemo, onAddressSelected, recipientSearch],
  );

  const handleAccountSelect = useCallback(
    (selectedAccount: Account) => {
      if (hasMemo) {
        recipientSearch.setValue(selectedAccount.freshAddress);
      }

      onAddressSelected(selectedAccount.freshAddress, undefined, !hasMemo);
    },
    [hasMemo, onAddressSelected, recipientSearch],
  );

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      onAddressSelected(address, ensName, true);
    },
    [onAddressSelected],
  );

  const handleRemoveAddress = useCallback(
    (address: RecentAddress) => {
      getRecentAddressesStore().removeAddress(currency.id, address.address);
      setRefreshCounter(prev => prev + 1);
    },
    [currency],
  );

  const searchState = useRecipientSearchState({
    searchValue: recipientSearch.value,
    result,
    isLoading,
    recipientSupportsDomain,
  });

  return {
    searchValue: recipientSearch.value,
    isLoading,
    result,
    recentAddresses,
    mainAccount,
    showInitialState,
    showInitialEmptyState,
    handleRecentAddressSelect,
    handleAccountSelect,
    handleAddressSelect,
    handleRemoveAddress,
    hasMemo,
    hasMemoValidationError,
    hasFilledMemo,
    memoType,
    memoTypeOptions,
    memoDefaultOption,
    memoMaxLength,
    ...searchState,
  };
}
