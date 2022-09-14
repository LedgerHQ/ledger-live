import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BottomDrawer, Text } from "@ledgerhq/native-ui";
import { NavigatorName } from "../../const";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";

import AddAccountsModalCard from "./AddAccountsModalCard";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const setupLedgerImg = require("../../images/illustration/Shared/_SetupLedger.png");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const syncCryptoImg = require("../../images/illustration/Shared/_SyncFromDesktop.png");

type Props = {
  navigation: any;
  isOpened: boolean;
  onClose: () => void;
};

export default function AddAccountsModal({
  navigation,
  onClose,
  isOpened,
}: Props) {
  const { t } = useTranslation();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const onClickAdd = useCallback(() => {
    navigation.navigate(NavigatorName.AddAccounts);
    onClose();
  }, [navigation, onClose]);

  const onClickImport = useCallback(() => {
    navigation.navigate(NavigatorName.ImportAccounts);
    onClose();
  }, [navigation, onClose]);

  return (
    <BottomDrawer testId="AddAccountsModal" isOpen={isOpened} onClose={onClose}>
      <Text variant="h4" fontWeight="semiBold" fontSize="24px" mb={2}>
        {t("addAccountsModal.title")}
      </Text>
      <Text
        variant="large"
        fontWeight="medium"
        fontSize="14px"
        color="neutral.c70"
        mb="32px"
      >
        {t("addAccountsModal.description")}
      </Text>

      {!readOnlyModeEnabled && (
        <AddAccountsModalCard
          title={t("addAccountsModal.add.title")}
          subTitle={t("addAccountsModal.add.description")}
          onPress={onClickAdd}
          imageSource={setupLedgerImg}
        />
      )}

      <AddAccountsModalCard
        title={t("addAccountsModal.import.title")}
        subTitle={t("addAccountsModal.import.description")}
        onPress={onClickImport}
        imageSource={syncCryptoImg}
      />
    </BottomDrawer>
  );
}
