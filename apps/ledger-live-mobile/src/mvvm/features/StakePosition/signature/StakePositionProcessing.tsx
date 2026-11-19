import React from "react";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

/** The device or the network works on the exit transaction. */
export function StakePositionProcessing({ testID }: Readonly<{ testID?: string }>) {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s16", paddingVertical: "s24" }} testID={testID}>
      <Spinner size={40} />
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("stakePosition.signature.processing")}
      </Text>
    </Box>
  );
}
