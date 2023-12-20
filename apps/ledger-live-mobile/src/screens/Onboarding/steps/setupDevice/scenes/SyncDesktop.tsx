import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Text, IconBoxList, IconsLegacy } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const { ComputerMedium, QrCodeMedium, ListMedium } = IconsLegacy;
const items = [
  {
    title: "onboarding.stepImportAccounts.bullets.0.label",
    icon: <ComputerMedium color="primary.c90" />,
    hasTemplateTitle: true,
  },
  {
    title: "onboarding.stepImportAccounts.bullets.1.label",
    icon: <QrCodeMedium color="primary.c90" />,
    hasTemplateTitle: false,
  },
  {
    title: "onboarding.stepImportAccounts.bullets.2.label",
    icon: <ListMedium color="primary.c90" />,
    hasTemplateTitle: false,
  },
];

const SyncDesktopScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2">{t("onboarding.stepImportAccounts.title")}</Text>
      <Text variant="body" color="neutral.c70" mt={5} mb={8} lineHeight="23.8px">
        {t("onboarding.stepImportAccounts.desc")}
      </Text>
      <IconBoxList
        iconShapes="circle"
        iconVariants="plain"
        items={items.map(item => ({
          Icon: item.icon,
          title: item.hasTemplateTitle ? (
            <Trans i18nKey={item.title}>
              {""}
              <Text fontWeight="semiBold" color="primary.c80" />
              {""}
            </Trans>
          ) : (
            <Text variant="body" fontWeight="medium" color="neutral.c100" lineHeight="16.94px">
              {t(item.title)}
            </Text>
          ),
        }))}
      />
    </>
  );
};

SyncDesktopScene.id = "SyncDesktopScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button type="main" size="large" onPress={onNext}>
      {t("onboarding.stepImportAccounts.cta")}
    </Button>
  );
};

SyncDesktopScene.Next = Next;

export default SyncDesktopScene;
