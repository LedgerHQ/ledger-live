import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

// Placeholder: the final design comes with LIVE-38357.
export function ConnectedView(): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", alignItems: "center", paddingVertical: "s32" }}>
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {t("connectNewDevice.connected.title")}
      </Text>
    </Box>
  );
}
