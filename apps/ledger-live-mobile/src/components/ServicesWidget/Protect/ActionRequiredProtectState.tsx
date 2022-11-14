import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/native-ui";
import { Linking } from "react-native";
import Button from "../../Button";

function ActionRequiredProtectState({
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
        {t(`servicesWidget.protect.status.actionRequired.actions.addNow`)}
      </Button>
      <Button type="default" outline={false} onPress={onViewDetails}>
        {t(`servicesWidget.protect.status.actionRequired.actions.viewDetails`)}
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
      {t(`servicesWidget.protect.status.actionRequired.title`)}
    </Tag>
  );
};

ActionRequiredProtectState.StatusTag = StateTag;

export default ActionRequiredProtectState;
