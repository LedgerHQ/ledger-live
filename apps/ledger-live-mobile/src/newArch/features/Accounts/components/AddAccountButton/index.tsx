import React, { FC, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AddAccountButton as AddAccountButtonComponent } from "@ledgerhq/native-ui/pre-ldls/components/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

type Props = {
  sourceScreenName: string;
  disabled?: boolean;
  currency?: CryptoOrTokenCurrency | string;
};

const AddAccountButton: FC<Props> = ({ sourceScreenName, disabled, currency }) => {
  const { t } = useTranslation();
  const [foundCurrency, setFoundCurrency] = useState<CryptoOrTokenCurrency | undefined>(
    typeof currency === "string" ? findCryptoCurrencyById(currency) : currency,
  );

  useEffect(() => {
    if (typeof currency === "string" && currency && !foundCurrency) {
      getCryptoAssetsStore()
        .findTokenById(currency)
        .then(token => setFoundCurrency(token));
    }
  }, [currency, foundCurrency]);

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState<boolean>(false);

  const handleOpenAddAccountModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName, currency });

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
      <AddAccountDrawer
        isOpened={isAddAccountModalOpen}
        onClose={handleCloseAddAccountModal}
        currency={foundCurrency}
      />
    </>
  );
};

export default AddAccountButton;
