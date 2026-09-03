import React from "react";
import { Box, Button, Link } from "@ledgerhq/lumen-ui-rnative";
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
    <Box lx={{ marginBottom: "s12" }}>
      <Box lx={{ alignItems: "center" }}>
        <NotificationsDrawerIllustration promptTarget={promptTarget} />
        <NotificationsPromptContent promptTarget={promptTarget} />
      </Box>
      <Button
        appearance="base"
        size="lg"
        isFull
        lx={{ marginTop: "s32", marginBottom: "s24" }}
        onPress={onAllow}
        testID="notifications-prompt-allow"
      >
        {t(allowKey)}
      </Button>
      <Link
        appearance="base"
        underline={false}
        onPress={onLater}
        testID="notifications-prompt-later"
      >
        {t(laterKey)}
      </Link>
    </Box>
  );
}
