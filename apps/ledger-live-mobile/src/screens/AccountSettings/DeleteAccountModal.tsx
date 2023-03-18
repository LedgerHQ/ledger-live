import React, { memo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { Flex, Text } from "@ledgerhq/native-ui";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import Button from "../../components/wrappedUi/Button";
import QueuedDrawer from "../../components/QueuedDrawer";

type Props = {
  onRequestClose: () => void;
  deleteAccount: () => void;
  account: Account;
  isOpen: boolean;
};

function DeleteAccountModal({ isOpen, onRequestClose, deleteAccount }: Props) {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onRequestClose}
      Icon={InfoMedium}
      iconColor={"error.c100"}
      title={t("account.settings.delete.confirmationTitle")}
    >
      <Text variant={"paragraph"} color={"neutral.c100"}>
        {t("account.settings.delete.confirmationDesc")}
      </Text>
      <Text variant={"paragraph"} color={"neutral.c100"}>
        {t("account.settings.delete.confirmationWarn")}
      </Text>
      <Flex justifyContent={"space-between"} mt={6} flexShrink={1} flexGrow={1}>
        <Button
          event="DeleteAccount"
          type={"error"}
          onPress={deleteAccount}
          mt={4}
        >
          <Trans i18nKey="common.delete" />
        </Button>
        <Button
          event="DeleteAccountCancel"
          type={"default"}
          onPress={onRequestClose}
          mt={4}
        >
          <Trans i18nKey="common.cancel" />
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

export default memo<Props>(DeleteAccountModal);
