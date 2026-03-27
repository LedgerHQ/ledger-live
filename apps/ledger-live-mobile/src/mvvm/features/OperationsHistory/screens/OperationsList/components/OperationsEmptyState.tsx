import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle, LumenTextStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";

export function OperationsEmptyState() {
  const { t } = useTranslation();

  return (
    <Box lx={containerStyle} testID="operations-empty-state">
      <Spot appearance="info" size={72} />
      <Box lx={textContainerStyle}>
        <Text typography="heading4SemiBold" lx={titleStyle}>
          {t("operationList.emptyTitle")}
        </Text>
        <Text typography="body2" lx={subtitleStyle}>
          {t("operationList.emptySubtitle")}
        </Text>
      </Box>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: "s24",
  width: "full",
};

const textContainerStyle: LumenViewStyle = {
  gap: "s8",
  alignItems: "center",
  width: "full",
};

const titleStyle: LumenTextStyle = {
  color: "base",
  textAlign: "center",
  width: "full",
};

const subtitleStyle: LumenTextStyle = {
  color: "muted",
  textAlign: "center",
  width: "full",
};
