import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export default function SendFlowEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Button testID="send-flow-sync-wallet" appearance="base" size="lg" isFull onPress={onPress}>
      {t("walletSync.entryPoints.sendFlow.title")}
    </Button>
  );
}
