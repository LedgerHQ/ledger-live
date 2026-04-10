import React, { useCallback } from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle, LumenTextStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

export function OperationsEmptyState() {
  const { t } = useTranslation();
  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: "OperationsList",
  });

  const onReceivePress = useCallback(() => {
    handleOpenReceiveDrawer();
  }, [handleOpenReceiveDrawer]);

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
      <Button appearance="base" size="lg" onPress={onReceivePress} lx={buttonStyle}>
        {t("operationList.emptyReceiveCta")}
      </Button>
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

const buttonStyle: LumenViewStyle = {
  width: "full",
};
