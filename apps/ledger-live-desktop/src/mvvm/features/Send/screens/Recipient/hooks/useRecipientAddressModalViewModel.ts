import { useCallback, useMemo, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { RecentAddress } from "../types";
import { useAddressValidation } from "./useAddressValidation";
import { useRecipientSearchState } from "./useRecipientSearchState";
import { normalizeLastUsedTimestamp } from "../utils/dateFormatter";
import { useSendFlowData } from "../../../context/SendFlowContext";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

  const recipientSearchState = useRecipientSearchState({
    searchValue: recipientSearch.value,
    result,
    isLoading,
    recipientSupportsDomain,
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
    const raw = getRecentAddressesStore().getAddresses(currency.id);
    const addressesWithMetadata = Array.isArray(raw) ? raw : [];
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    return addressesWithMetadata
      .filter(entry => {
        if (!isRecord(entry)) return false;
        const address = entry.address;
        if (typeof address !== "string" || address.length === 0) return false;
        if (
          selfTransferPolicy === "impossible" &&
          address.toLowerCase() === mainAccount.freshAddress.toLowerCase()
        ) {
          return false;
        }
        return true;
      })
      .map(entry => {
        if (!isRecord(entry) || typeof entry.address !== "string") {
          // Should never happen due to filter above
          return null;
        }

        const address = entry.address;
        const ensName = typeof entry.ensName === "string" ? entry.ensName : undefined;
        const lastUsed = typeof entry.lastUsed === "number" ? entry.lastUsed : undefined;
        const lastUsedTimestamp = normalizeLastUsedTimestamp(lastUsed);
        const matchedAccount = userAccountsByAddress.get(address.toLowerCase());
        const recentAddress: RecentAddress = {
          address,
          currency,
          lastUsedAt: new Date(lastUsedTimestamp),
          name: address,
          ensName,
          isLedgerAccount: !!matchedAccount,
          accountId: matchedAccount?.id,
        };
        return recentAddress;
      })
      .filter((value): value is RecentAddress => value !== null);
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

  return {
    searchValue: recipientSearch.value,
    isLoading,
    result,
    recentAddresses,
    mainAccount,
    showInitialState,
    showInitialEmptyState,
    ...recipientSearchState,
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
  };
}
