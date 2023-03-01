import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import { urls } from "../../../config/urls";
import Button from "../../Button";

function ConfirmIdentityProtectState({
  params,
}: {
  params: Record<string, string>;
}) {
  const { t } = useTranslation();

  const { confirmNowURI, viewDetailsURI } = params || {};

  const onConfirmNow = useCallback(() => {
    const url = `${confirmNowURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [confirmNowURI]);

  const onViewDetails = useCallback(() => {
    const url = `${viewDetailsURI}&source=${urls.recoverSources.myLedger}`;
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  }, [viewDetailsURI]);

  return (
    <>
      <Button type="main" outline={false} onPress={onConfirmNow} mt={8} mb={6}>
        {t(`servicesWidget.protect.status.confirmIdentity.actions.confirmNow`)}
      </Button>
      <Button type="default" outline={false} onPress={onViewDetails}>
        {t(`servicesWidget.protect.status.confirmIdentity.actions.viewDetails`)}
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
      {t(`servicesWidget.protect.status.confirmIdentity.title`)}
    </Tag>
  );
};

ConfirmIdentityProtectState.StatusTag = StateTag;

export default ConfirmIdentityProtectState;
