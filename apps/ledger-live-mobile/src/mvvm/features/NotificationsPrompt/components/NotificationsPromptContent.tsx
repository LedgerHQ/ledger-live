import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ABTestingVariants } from "@ledgerhq/types-live";

export const NotificationsPromptContent = () => {
  const { t } = useTranslation();
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const isVariantB =
    featureNewWordingNotificationsDrawer?.enabled === true &&
    featureNewWordingNotificationsDrawer?.params?.variant === ABTestingVariants.variantB;

  return (
    <>
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
        {isVariantB ? t("notifications.prompt.titleVariantB") : t("notifications.prompt.title")}
      </Text>

      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        mt={3}
      >
        {isVariantB ? t("notifications.prompt.descVariantB") : t("notifications.prompt.desc")}
      </Text>
    </>
  );
};
