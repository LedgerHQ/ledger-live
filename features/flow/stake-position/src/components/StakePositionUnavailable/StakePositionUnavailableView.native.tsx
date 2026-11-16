import React from "react";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import type { StakePositionUnavailableViewProps } from "./StakePositionUnavailableView.types";

export function StakePositionUnavailableView(props: StakePositionUnavailableViewProps) {
  if (props.reason === "loading") {
    return (
      <Box lx={{ alignItems: "center", gap: "s16", paddingVertical: "s24" }} testID={props.testID}>
        <Spinner size={40} />
        <Text typography="body2" lx={{ color: "muted" }}>
          {props.text}
        </Text>
      </Box>
    );
  }

  return (
    <Box lx={{ gap: "s24" }} testID={props.testID}>
      <Box lx={{ gap: "s8" }}>
        <Text accessibilityRole="header" typography="heading4SemiBold" lx={{ color: "base" }}>
          {props.title}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {props.description}
        </Text>
      </Box>
      <Button appearance="gray" size="lg" isFull onPress={props.onDismiss}>
        {props.closeLabel}
      </Button>
    </Box>
  );
}
