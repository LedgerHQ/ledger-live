import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { useAddressValidation } from "./useAddressValidation";

type UseRecipientAddressModalViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  onAddressSelected: (address: string, domainName?: string, goToNextStep?: boolean) => void;
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

  const mainAccount = getMainAccount(account, parentAccount);

  const { result, isLoading } = useAddressValidation({
    searchValue: recipientSearch.value,
    currency,
    account,
    parentAccount,
    currentAccountId: mainAccount.id,
  });

  const hasSearchValue = recipientSearch.value.length > 0;
  const showInitialState = !hasSearchValue;

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

  const handleAddressSelect = useCallback(
    (address: string, domainName?: string) => {
      onAddressSelected(address, domainName, true);
    },
    [onAddressSelected],
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
    showInitialState,
    handleAddressSelect,
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
