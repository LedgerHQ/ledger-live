import { track } from "@shared/analytics";
import React, { FC, useState, useEffect } from "react";
import { useTranslation } from "~/context/Locale";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { Box, CardButton } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

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
      <Box lx={{ flexDirection: "row" }}>
        <CardButton
          appearance="outline"
          icon={Plus}
          title={t("addAccounts.addNewOrExisting")}
          hideChevron
          onPress={handleOpenAddAccountModal}
          disabled={disabled}
          lx={{ marginVertical: "s12" }}
          testID="add-new-account-button"
        />
      </Box>
      <AddAccountDrawer
        isOpened={isAddAccountModalOpen}
        onClose={handleCloseAddAccountModal}
        currency={foundCurrency}
      />
    </>
  );
};

export default AddAccountButton;
