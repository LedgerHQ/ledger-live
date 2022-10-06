import { IconBoxList, Icons, Tag, Divider } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../../Button";

const items = [
  {
    title: "servicesWidget.protect.status.new.0.title",
    Icon: Icons.ShieldCheckMedium,
  },
  {
    title: "servicesWidget.protect.status.new.1.title",
    Icon: Icons.LockAltMedium,
  },
  {
    title: "servicesWidget.protect.status.new.2.title",
    Icon: Icons.MicrochipMedium,
  },
  {
    title: "servicesWidget.protect.status.new.3.title",
    Icon: Icons.ChartNetworkMedium,
  },
];

function NewProtectState() {
  const { t } = useTranslation();

  return (
    <>
      <Divider my={8} />
      <IconBoxList
        items={items.map(item => ({
          Icon: item.Icon,
          title: t(item.title),
        }))}
      />
      <Button
        type="main"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
        mb={6}
      >
        {t(`servicesWidget.protect.status.new.actions.learnMore`)}
      </Button>
      <Button
        type="default"
        outline={false}
        onPress={() => {
          /** @TODO redirect to correct live app */
        }}
      >
        {t(`servicesWidget.protect.status.new.actions.alreadySubscribed`)}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="hsla(40, 50%, 64%, 1)"
      textColor="neutral.c00"
      ellipsizeMode="tail"
      size="medium"
    >
      {t(`servicesWidget.protect.status.new.title`)}
    </Tag>
  );
};

NewProtectState.StatusTag = StateTag;

export default NewProtectState;
