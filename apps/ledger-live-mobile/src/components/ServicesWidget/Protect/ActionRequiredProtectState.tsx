import React from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/native-ui";
import Button from "../../Button";

function ActionRequiredProtectState() {
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
        {t(`servicesWidget.protect.status.actionRequired.actions.addNow`)}
      </Button>
      <Button
        type="default"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
      >
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
