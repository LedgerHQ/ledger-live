import React from "react";
import { useTranslation } from "react-i18next";
import useSelectAddAccountMethodViewModel from "./useSelectAddAccountMethodViewModel";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import ActionRow from "LLM/components/ActionRow";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type ViewProps = {
  isWalletSyncEnabled: boolean | undefined;
  isReadOnlyModeEnabled: boolean;
  doesNotHaveAccount?: boolean;
  onClickAdd: () => void;
  onClickImport: () => void;
  onClickImportLedgerSync?: () => void;
};

type AddAccountScreenProps = {
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onClose?: () => void;
  setWalletSyncDrawerVisible?: () => void;
};

function View({
  isWalletSyncEnabled,
  isReadOnlyModeEnabled,
  onClickAdd,
  onClickImport,
  onClickImportLedgerSync,
  doesNotHaveAccount,
}: ViewProps) {
  const { t } = useTranslation();
  const rows = [];

  if (!isReadOnlyModeEnabled) {
    rows.push({
      titleKey: "addAccountsModal.drawer.add.title",
      descriptionKey: "addAccountsModal.drawer.add.description",
      onPress: onClickAdd,
      icon: <Icons.LedgerDevices color={"primary.c80"} />,
      testID: "add-accounts-modal-add-button",
    });
  }
  if (isWalletSyncEnabled) {
    rows.push({
      titleKey: "addAccountsModal.drawer.walletSync.title",
      onPress: onClickImportLedgerSync,
      icon: <Icons.Refresh color={"primary.c80"} />,
      testID: "add-accounts-modal-wallet-sync-button",
    });
  } else {
    rows.push({
      titleKey: "addAccountsModal.drawer.import.title",
      descriptionKey: "addAccountsModal.drawer.import.description",
      onPress: onClickImport,
      icon: <Icons.QrCode color={"primary.c80"} />,
      testID: "add-accounts-modal-import-button",
    });
  }

  return (
    <>
      <Text variant="h4" fontWeight="semiBold" fontSize="24px" mb="32px">
        {doesNotHaveAccount
          ? t("addAccountsModal.title")
          : t("addAccountsModal.drawer.drawerTitleHasAccount")}
      </Text>

      <Flex flexDirection="column" rowGap={16}>
        {rows.map((row, index) => (
          <ActionRow
            key={index}
            title={t(row.titleKey)}
            description={t(row.descriptionKey ?? "")}
            onPress={row.onPress}
            icon={row.icon}
            testID={row.testID}
          />
        ))}
      </Flex>
    </>
  );
}

const SelectAddAccountMethod = (props: AddAccountScreenProps) => {
  return <View {...useSelectAddAccountMethodViewModel(props)} {...props} />;
};

export default SelectAddAccountMethod;
