import React from "react";
import { Flex, Link as TextLink, Button } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { NotificationsDrawerIllustration } from "LLM/features/NotificationsPrompt/components/NotificationsDrawerIllustration";
import { NotificationsPromptContent } from "LLM/features/NotificationsPrompt/components/NotificationsPromptContent";
import { getNotificationsPromptCopy } from "LLM/features/NotificationsPrompt/utils/getNotificationsPromptCopy";
import type { NotificationPromptTarget } from "LLM/features/NotificationsPrompt/types";

type Props = {
  promptTarget: NotificationPromptTarget | undefined;
  onAllow: () => void;
  onLater: () => void;
};

export function NotificationsPromptDrawerView({ promptTarget, onAllow, onLater }: Readonly<Props>) {
  const { t } = useTranslation();
  const { allowKey, laterKey } = getNotificationsPromptCopy(promptTarget);

  return (
    <Flex mb={4}>
      <Flex alignItems="center">
        <NotificationsDrawerIllustration promptTarget={promptTarget} />
        <NotificationsPromptContent promptTarget={promptTarget} />
      </Flex>
      <Button type="main" mt={8} mb={7} onPress={onAllow} testID="notifications-prompt-allow">
        {t(allowKey)}
      </Button>
      <TextLink type="shade" onPress={onLater} testID="notifications-prompt-later">
        {t(laterKey)}
      </TextLink>
    </Flex>
  );
}
