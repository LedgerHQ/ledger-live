import { Tag } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { urls } from "../../../config/urls";
import Button from "../../Button";

function PaymentRejectedProtectState({
  params,
}: {
  params: Record<string, string>;
}) {
  const { t } = useTranslation();

  const { editNowURI, viewDetailsURI } = params || {};

  const onEditNow = useCallback(() => {
    const url = `${editNowURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [editNowURI]);

  const onViewDetails = useCallback(() => {
    const url = `${viewDetailsURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [viewDetailsURI]);

  return (
    <>
      <Button type="main" outline={false} onPress={onEditNow} mb={6} mt={8}>
        {t(`servicesWidget.protect.status.paymentRejected.actions.editNow`)}
      </Button>
      <Button type="default" outline={false} onPress={onViewDetails}>
        {t(`servicesWidget.protect.status.paymentRejected.actions.viewDetails`)}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="warning.c50"
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
