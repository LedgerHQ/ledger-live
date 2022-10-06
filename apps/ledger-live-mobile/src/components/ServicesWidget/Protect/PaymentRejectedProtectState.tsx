import { Tag } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../Button";

function PaymentRejectedProtectState() {
  const { t } = useTranslation();

  return (
    <>
      <Button
        type="main"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
        mb={6}
        mt={8}
      >
        {t(`servicesWidget.protect.status.paymentRejected.actions.editNow`)}
      </Button>
      <Button
        type="default"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
      >
        {t(`servicesWidget.protect.status.paymentRejected.actions.viewDetails`)}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="hsla(36, 94%, 56%, 1)"
      textColor="neutral.c00"
      ellipsizeMode="tail"
      size="medium"
    >
      {t(`servicesWidget.protect.status.paymentRejected.title`)}
    </Tag>
  );
};

PaymentRejectedProtectState.StatusTag = StateTag;

export default PaymentRejectedProtectState;
