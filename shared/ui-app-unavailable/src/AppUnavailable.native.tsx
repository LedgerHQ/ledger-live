import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTENT_MAX_WIDTH_PX, SPOT_SIZE } from "./internals/layout";
import { columnStyle, contentStyle, copyStyle, rootStyle } from "./styles.native";
import type { AppUnavailableProps } from "./types";

export function AppUnavailable({ title, description, action, testID }: AppUnavailableProps) {
  return (
    <Box lx={rootStyle} testID={testID}>
      <Box lx={columnStyle} style={{ maxWidth: CONTENT_MAX_WIDTH_PX }}>
        <Box lx={contentStyle}>
          <Spot icon={Globe} size={SPOT_SIZE} />
          <Box lx={copyStyle}>
            <Text
              accessibilityRole="header"
              typography="heading4SemiBold"
              lx={{ color: "base", textAlign: "center", width: "full" }}
            >
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
              {description}
            </Text>
          </Box>
        </Box>
        {action ? (
          <Button
            appearance="gray"
            size="lg"
            icon={ExternalLink}
            onPress={action.onPress}
            testID={action.testID}
          >
            {action.label}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
