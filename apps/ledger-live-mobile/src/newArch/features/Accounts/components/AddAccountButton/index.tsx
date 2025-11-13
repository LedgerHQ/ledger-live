import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { track } from "~/analytics";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AddAccountButton as AddAccountButtonComponent } from "@ledgerhq/native-ui/pre-ldls/components/index";

type Props = {
  sourceScreenName: string;
  disabled?: boolean;
  currency?: CryptoOrTokenCurrency | string;
};

const AddAccountButton: FC<Props> = ({ sourceScreenName, disabled, currency }) => {
  const { t } = useTranslation();

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
      <AddAccountDrawer isOpened={isAddAccountModalOpen} onClose={handleCloseAddAccountModal} />
    </>
  );
};

export default AddAccountButton;
