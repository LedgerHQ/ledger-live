import React, { useCallback, useState } from "react";
import { Linking, Pressable } from "react-native";
import { Banner, Box, Button, Checkbox, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import type { SkipMemoState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientMemoCore";

type SkipMemoSectionProps = Readonly<{
  memoLabel: string;
  state: SkipMemoState;
  onRequestConfirm: () => void;
  onConfirm: (doNotAskAgain: boolean) => void;
}>;

function SkipMemoSectionComponent({
  memoLabel,
  state,
  onRequestConfirm,
  onConfirm,
}: SkipMemoSectionProps) {
  const { t } = useTranslation();
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);
  const learnMoreUrl = useLocalizedUrl(urls.memoTag);

  const handleLearnMore = useCallback(() => {
    if (learnMoreUrl) Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  const handleConfirm = useCallback(() => {
    onConfirm(doNotAskAgain);
  }, [onConfirm, doNotAskAgain]);

  if (state === "propose") {
    return (
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
        <Text lx={{ color: "muted" }}>
          {t("send.newSendFlow.skipMemo.notRequired", { tag: memoLabel })}
        </Text>
        <Link appearance="accent" size="sm" onPress={onRequestConfirm}>
          {t("common.skip")}
        </Link>
      </Box>
    );
  }

  return (
    <Box lx={{ gap: "s16" }}>
      <Banner
        appearance="warning"
        title={t("send.newSendFlow.skipMemo.title", { tag: memoLabel })}
        description={t("send.newSendFlow.skipMemo.warning", { tag: memoLabel })}
        primaryAction={
          <Button appearance="transparent" size="sm" onPress={handleConfirm}>
            {t("send.newSendFlow.skipMemo.confirm")}
          </Button>
        }
        secondaryAction={
          <Button appearance="no-background" size="sm" onPress={handleLearnMore}>
            {t("common.learnMore")}
          </Button>
        }
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: doNotAskAgain }}
        onPress={() => setDoNotAskAgain(prev => !prev)}
      >
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
          <Box pointerEvents="none">
            <Checkbox checked={doNotAskAgain} />
          </Box>
          <Text lx={{ color: "base" }}>{t("send.newSendFlow.skipMemo.neverAskAgain")}</Text>
        </Box>
      </Pressable>
    </Box>
  );
}

export const SkipMemoSection = React.memo(SkipMemoSectionComponent);
