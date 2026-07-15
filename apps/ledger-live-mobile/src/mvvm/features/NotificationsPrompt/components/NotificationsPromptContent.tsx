import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import type { NotificationPromptTarget } from "../types";
import { getNotificationsPromptCopy } from "../utils/getNotificationsPromptCopy";

type NotificationsPromptContentProps = {
  promptTarget?: NotificationPromptTarget;
};

export const NotificationsPromptContent = ({ promptTarget }: NotificationsPromptContentProps) => {
  const { t } = useTranslation();

  const { titleKey, descriptionKey } = getNotificationsPromptCopy(promptTarget);

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
