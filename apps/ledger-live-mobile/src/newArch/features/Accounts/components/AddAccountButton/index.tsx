import React, { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  ModularDrawerLocation,
  useModularDrawerController,
  useModularDrawerVisibility,
} from "LLM/features/ModularDrawer";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { AddAccountButton as AddAccountButtonComponent } from "@ledgerhq/native-ui/pre-ldls/components/index";

type Props = {
  sourceScreenName: string;
  onClick?: () => void;
  disabled?: boolean;
  currency?: CryptoOrTokenCurrency | string;
};

const AddAccountButton: FC<Props> = ({ sourceScreenName, disabled, currency, onClick }) => {
  const { t } = useTranslation();

  const currencyToUse = typeof currency === "string" ? findCryptoCurrencyById(currency) : currency;

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState<boolean>(false);

  const { openDrawer } = useModularDrawerController();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const handleOnclick = useCallback(() => {
    if (isModularDrawerVisible(ModularDrawerLocation.ADD_ACCOUNT)) {
      handleCloseAddAccountModal();
      return openDrawer({
        currencies: currencyToUse ? [currencyToUse] : [],
        flow: "add_account",
        source: sourceScreenName,
      });
    } else {
      return onClick?.();
    }
  }, [currencyToUse, isModularDrawerVisible, onClick, openDrawer, sourceScreenName]);

  const handleOpenAddAccountModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName, currency });
    if (onClick) {
      handleOnclick();

      return;
    }
    setIsAddAccountModalOpen(true);
  };

  const handleCloseAddAccountModal = () => setIsAddAccountModalOpen(false);

  return (
    <>
      <AddAccountButtonComponent
        label={t("addAccounts.addNewOrExisting")}
        onClick={handleOpenAddAccountModal}
        disabled={disabled}
      />
      <AddAccountDrawer isOpened={isAddAccountModalOpen} onClose={handleCloseAddAccountModal} />
    </>
  );
};

export default AddAccountButton;
