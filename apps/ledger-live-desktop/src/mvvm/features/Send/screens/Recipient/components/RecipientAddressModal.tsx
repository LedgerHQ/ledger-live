import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import React, { useEffect } from "react";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useRecipientContinuation } from "../../../context/RecipientContinuationContext";
import { useRecipientAddressModalViewModel } from "../hooks/useRecipientAddressModalViewModel";
import { RecipientAddressModalView } from "./RecipientAddressModalView";

type RecipientAddressModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoOrTokenCurrency;
  onAddressSelected: (
    address: string,
    ensName?: string,
    goToNextStep?: boolean,
    memo?: Memo,
    contactId?: string,
  ) => void;
  recipientSupportsDomain: boolean;
}>;

export function RecipientAddressModal({
  account,
  parentAccount,
  currency,
  onAddressSelected,
  recipientSupportsDomain = false,
}: RecipientAddressModalProps) {
  const { setIsRecipientAddressComplete } = useSendFlowActions();
  const { isFamilyRecipientBlocked } = useRecipientContinuation();
  const { isAddressValid, ...viewModel } = useRecipientAddressModalViewModel({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  // A family notice (e.g. Zcash shielded sync not complete) can block the step even
  // when the address itself is valid, so the recipient is only complete when both
  // hold.
  useEffect(() => {
    setIsRecipientAddressComplete(isAddressValid && !isFamilyRecipientBlocked);
  }, [isAddressValid, isFamilyRecipientBlocked, setIsRecipientAddressComplete]);

  return <RecipientAddressModalView {...viewModel} />;
}
