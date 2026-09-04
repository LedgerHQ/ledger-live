import { Button } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";

export default function SendFlowEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Button
      data-testid="send-flow-sync-wallet"
      appearance="base"
      size="lg"
      className="w-full"
      onClick={onPress}
    >
      {t("walletSync.entryPoints.sendFlow.title")}
    </Button>
  );
}
