import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import { urls } from "../../../config/urls";
import Button from "../../Button";

function AddPaymentProtectState({
  params,
}: {
  params: Record<string, string>;
}) {
  const { t } = useTranslation();

  const { addNowURI, viewDetailsURI } = params || {};

  const onAddNow = useCallback(() => {
    const url = `${addNowURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [addNowURI]);

  const onViewDetails = useCallback(() => {
    const url = `${viewDetailsURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [viewDetailsURI]);

  return (
    <>
      <Button type="main" outline={false} onPress={onAddNow} mt={8} mb={6}>
        {t(`servicesWidget.protect.status.addPayment.actions.addNow`)}
      </Button>
      <Button type="default" outline={false} onPress={onViewDetails}>
        {t(`servicesWidget.protect.status.addPayment.actions.viewDetails`)}
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
      {t(`servicesWidget.protect.status.addPayment.title`)}
    </Tag>
  );
};

AddPaymentProtectState.StatusTag = StateTag;

export default AddPaymentProtectState;
