import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  SubheaderInfo,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";

const CONTENT_BOTTOM_SPACING = 24;

export function CardAssetsInfoTooltip({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SubheaderInfo accessibilityLabel={description} testID="card-assets-info" />
      </TooltipTrigger>
      <TooltipContent
        title={title}
        content={
          <Box style={{ paddingBottom: bottom + CONTENT_BOTTOM_SPACING }}>
            <Text typography="body1" lx={{ color: "base" }}>
              {description}
            </Text>
          </Box>
        }
      />
    </Tooltip>
  );
}
