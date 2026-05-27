import React from "react";
import { Box, Button as LumenButton } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { GenericAwarenessModalDebugTrigger } from "~/dynamicContent/buildLocalGenericAwarenessModalCards";

type GenericAwarenessTriggerSelectorProps = Readonly<{
  value: GenericAwarenessModalDebugTrigger;
  onChange: (trigger: GenericAwarenessModalDebugTrigger) => void;
}>;

export function GenericAwarenessTriggerSelector({
  value,
  onChange,
}: GenericAwarenessTriggerSelectorProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ flexDirection: "row", marginBottom: "s16" }}>
      <Box lx={{ flex: 1, marginRight: "s8" }}>
        <LumenButton
          appearance={value === "appStart" ? "accent" : "base"}
          size="md"
          onPress={() => onChange("appStart")}
          testID="debug-generic-awareness-trigger-app-start"
          isFull
        >
          {t("settings.debug.contentCards.genericAwareness.appStart")}
        </LumenButton>
      </Box>
      <Box lx={{ flex: 1, marginLeft: "s8" }}>
        <LumenButton
          appearance={value === "deeplink" ? "accent" : "base"}
          size="md"
          onPress={() => onChange("deeplink")}
          testID="debug-generic-awareness-trigger-deeplink"
          isFull
        >
          {t("settings.debug.contentCards.genericAwareness.deeplink")}
        </LumenButton>
      </Box>
    </Box>
  );
}
