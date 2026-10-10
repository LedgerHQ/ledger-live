import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
import { screenStyle } from "../screenStyle";

export function PreparingScreen() {
  return (
    <Box lx={screenStyle} testID="os-update-preparing-screen">
      <Spinner size={32} />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
        <Trans i18nKey="osUpdates.preparing.title" />
      </Text>
    </Box>
  );
}
