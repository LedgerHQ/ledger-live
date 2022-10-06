import { Tag } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../Button";

function ActiveProtectState() {
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
      >
        {t(`servicesWidget.protect.status.active.actions.viewDetails`)}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="primary.c80"
      textColor="neutral.c00"
      ellipsizeMode="tail"
      size="medium"
    >
      {t(`servicesWidget.protect.status.active.title`)}
    </Tag>
  );
};

ActiveProtectState.StatusTag = StateTag;

export default ActiveProtectState;
