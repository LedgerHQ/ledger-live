import React, { useState, useCallback } from "react";
import { BaseModal, Button, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

export function NotAvailable() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [isOpen, setIsOpen] = useState(true);

  const onPressBack = useCallback(() => {
    setIsOpen(false);
    navigation.goBack();
  }, [navigation]);

  return (
    <BaseModal
      isOpen={isOpen}
      noCloseButton
      Icon={Icons.RedelegateMedium}
      title={t("transfer.swap2.form.notAvailable.title")}
      description={t("transfer.swap2.form.notAvailable.content")}
    >
      <Button type="main" onPress={onPressBack}>
        {t("common.back")}
      </Button>
    </BaseModal>
  );
}
