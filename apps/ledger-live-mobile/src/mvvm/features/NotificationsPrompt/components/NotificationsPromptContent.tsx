import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { useFeature } from "@features/platform-feature-flags";
import { AB_TESTING_VARIANTS } from "../types/variants";
import type { NotificationPromptTarget } from "../types";
import { getNotificationsPromptCopy } from "../utils/getNotificationsPromptCopy";

type NotificationsPromptContentProps = {
  promptTarget?: NotificationPromptTarget;
};

export const NotificationsPromptContent = ({ promptTarget }: NotificationsPromptContentProps) => {
  const { t } = useTranslation();
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const isVariantB =
    featureNewWordingNotificationsDrawer?.enabled === true &&
    featureNewWordingNotificationsDrawer?.params?.variant === AB_TESTING_VARIANTS.B;

  const { titleKey, descriptionKey } = getNotificationsPromptCopy(promptTarget, isVariantB);

  return (
    <>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
        {t(titleKey)}
      </Text>

      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        mt={3}
      >
        {t(descriptionKey)}
      </Text>
    </>
  );
};
