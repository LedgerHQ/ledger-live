import { Tag } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../Button";

function SubscriptionCanceledProtectState() {
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="main"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
        mt={8}
        mb={6}
      >
        {t(
          `servicesWidget.protect.status.subscriptionCanceled.actions.contactLedgerSupport`,
        )}
      </Button>
      <Button
        type="default"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
      >
        {t(
          `servicesWidget.protect.status.subscriptionCanceled.actions.viewDetails`,
        )}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="neutral.c40"
      textColor="neutral.c90"
      ellipsizeMode="tail"
      size="medium"
    >
      {t(`servicesWidget.protect.status.subscriptionCanceled.title`)}
    </Tag>
  );
};

SubscriptionCanceledProtectState.StatusTag = StateTag;

export default SubscriptionCanceledProtectState;
