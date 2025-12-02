import React, { useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { RecipientAddressModal } from "./components/RecipientAddressModal";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { setDrawer } from "~/renderer/drawers/Provider";
import { closeModal, openModal } from "~/renderer/actions/modals";
import ModularDrawerFlowManager from "LLD/features/ModularDrawer/ModularDrawerFlowManager";
import { CloseButton } from "LLD/features/ModularDrawer/components/CloseButton";

type SendRecipientFlowProps = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  onClose: () => void;
  fromMAD?: boolean;
  onRecipientSelected: (recipient: string, ensName?: string) => void;
}>;

export function SendRecipientFlow({
  account,
  parentAccount,
  onClose,
  fromMAD = false,
  onRecipientSelected,
}: SendRecipientFlowProps) {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    address: string;
    ensName?: string;
  } | null>(null);

  const currency = getAccountCurrency(account);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const balance = account.type === "Account" ? account.spendableBalance : account.balance;
  const balanceValue = balance.toNumber();

  const counterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: balanceValue,
    disableRounding: true,
  });

  const availableBalanceUSD = useMemo(() => {
    if (typeof counterValue !== "number") {
      return "";
    }
    return formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(counterValue), {
      showCode: true,
    });
  }, [counterValue, counterValueCurrency]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecipient(null);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (fromMAD) {
      // Return to MAD: reopen the drawer and close the modal
      setIsModalOpen(false);
      setSelectedRecipient(null);
      dispatch(closeModal("MODAL_SEND"));

      const handleAccountSelected = (
        selectedAccount: AccountLike,
        selectedParentAccount?: Account,
      ) => {
        setDrawer();
        dispatch(closeModal("MODAL_SEND"));
        dispatch(
          openModal("MODAL_SEND", {
            account: selectedAccount,
            parentAccount: selectedParentAccount,
            fromMAD: true,
          } as Parameters<typeof openModal<"MODAL_SEND">>[1]),
        );
      };

      const handleDrawerClose = () => {
        setDrawer();
        dispatch(closeModal("MODAL_SEND"));
        onClose();
      };

      setDrawer(
        ModularDrawerFlowManager,
        {
          currencies: [],
          onAccountSelected: handleAccountSelected,
          drawerConfiguration: {
            assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
            networks: { leftElement: "undefined", rightElement: "undefined" },
          },
        },
        {
          onRequestClose: handleDrawerClose,
          closeButtonComponent: CloseButton,
        },
      );
    } else {
      // From account page: simply close the modal
      handleClose();
    }
  }, [fromMAD, dispatch, onClose, handleClose]);

  const handleAddressSelected = useCallback((address: string, ensName?: string) => {
    setSelectedRecipient({ address, ensName });
  }, []);

  const handleConfirmRecipient = useCallback(() => {
    if (selectedRecipient) {
      setIsModalOpen(false);
      onRecipientSelected(selectedRecipient.address, selectedRecipient.ensName);
    }
  }, [selectedRecipient, onRecipientSelected]);

  return (
    <RecipientAddressModal
      isOpen={isModalOpen}
      onClose={handleClose}
      onBack={handleBack}
      account={account}
      parentAccount={parentAccount}
      currency={currency}
      availableBalance={availableBalanceUSD}
      onAddressSelected={handleAddressSelected}
      selectedRecipient={selectedRecipient}
      onConfirmRecipient={handleConfirmRecipient}
    />
  );
}
