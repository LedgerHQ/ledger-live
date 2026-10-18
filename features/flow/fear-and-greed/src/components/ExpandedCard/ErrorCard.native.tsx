import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "@shared/i18n";
import { EXPANDED_CARD_HEIGHT } from "./constants";

type ErrorCardProps = Readonly<{
  width?: number;
  testID?: string;
}>;

export function ErrorCard({ width, testID }: ErrorCardProps) {
  const { t } = useTranslation();

  return (
    <Box testID={testID} lx={cardStyle} style={{ width, height: EXPANDED_CARD_HEIGHT }}>
      <Text typography="body3" numberOfLines={1} lx={{ color: "muted", marginBottom: "s4" }}>
        {t("fearAndGreed.title")}
      </Text>
      <Box lx={messageStyle}>
        <Box testID={testID ? `${testID}-icon` : undefined} lx={{ flexShrink: 0 }}>
          <Warning size={16} color="error" />
        </Box>
        <Text typography="body2SemiBold" numberOfLines={1} lx={{ color: "base", flexShrink: 1 }}>
          {t("marketBanner.connectionFailed")}
        </Text>
      </Box>
    </Box>
  );
}

const cardStyle: LumenViewStyle = {
  backgroundColor: "muted",
  borderRadius: "md",
  padding: "s12",
  justifyContent: "center",
};

const messageStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s6",
};
