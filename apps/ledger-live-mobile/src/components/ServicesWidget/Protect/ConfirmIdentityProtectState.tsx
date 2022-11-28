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

  const { addNowURI, viewDetailsURI } = params || {};

  const onAddNow = useCallback(() => {
    Linking.canOpenURL(addNowURI).then(() => Linking.openURL(addNowURI));
  }, [addNowURI]);

  const onViewDetails = useCallback(() => {
    Linking.canOpenURL(viewDetailsURI).then(() =>
      Linking.openURL(viewDetailsURI),
    );
  }, [viewDetailsURI]);

  return (
    <>
      <Button type="main" outline={false} onPress={onAddNow} mt={8} mb={6}>
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
      color="hsla(36, 94%, 56%, 1)"
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
