import React from "react";

import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

type Props = {
  onClickConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmManageKey({ onClickConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <Flex pb={4}>
      <Text variant="h5" fontWeight="semiBold" color="neutral.c100" mb={6}>
        {t("walletSync.walletSyncActivated.manageKey.confirm.title")}
      </Text>

      <Text variant="bodyLineHeight" fontWeight="medium" color="neutral.c70" mb={7}>
        {t("walletSync.walletSyncActivated.manageKey.confirm.desc")}
      </Text>

      <Flex flexDirection="row" justifyContent="space-between">
        <Flex flex={1} mr={2}>
          <Button onPress={onCancel} outline type="main">
            {t("walletSync.walletSyncActivated.manageKey.confirm.cancel")}
          </Button>
        </Flex>
        <Flex flex={1} ml={2}>
          <Button onPress={onClickConfirm} type="main" testID="delete-trustchain">
            {t("walletSync.walletSyncActivated.manageKey.confirm.delete")}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
