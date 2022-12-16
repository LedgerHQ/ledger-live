import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import Button from "../../Button";

function ConfirmIdentityProtectState({
  params,
}: {
  params: Record<string, string>;
}) {
  const { t } = useTranslation();

  const { confirmNowURI, viewDetailsURI } = params || {};

  const source = "ledgerlive://myledger";

  const onConfirmNow = useCallback(() => {
    Linking.canOpenURL(confirmNowURI).then(() =>
      Linking.openURL(`${confirmNowURI}&source=${source}`),
    );
  }, [confirmNowURI, source]);

  const onViewDetails = useCallback(() => {
    Linking.canOpenURL(viewDetailsURI).then(() =>
      Linking.openURL(`${viewDetailsURI}&source=${source}`),
    );
  }, [source, viewDetailsURI]);

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
