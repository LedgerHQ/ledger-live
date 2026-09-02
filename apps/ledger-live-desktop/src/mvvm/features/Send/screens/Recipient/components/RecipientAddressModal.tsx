import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import React, { useEffect } from "react";
import { useSendFlowActions } from "../../../context/SendFlowContext";
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
  const { isAddressValid, ...viewModel } = useRecipientAddressModalViewModel({
    account,
    parentAccount,
    currency,
    onAddressSelected,
    recipientSupportsDomain,
  });

  useEffect(() => {
    setIsRecipientAddressComplete(isAddressValid);
  }, [isAddressValid, setIsRecipientAddressComplete]);

  return <RecipientAddressModalView {...viewModel} />;
}
