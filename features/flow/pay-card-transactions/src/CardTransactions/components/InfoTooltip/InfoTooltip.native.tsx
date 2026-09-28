import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  InteractiveIcon,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";

type InfoTooltipProps = Readonly<{
  title: string;
  description: string;
  testID?: string;
}>;

const CONTENT_BOTTOM_SPACING = 24;

export function InfoTooltip({ title, description, testID }: InfoTooltipProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InteractiveIcon
          icon={Information}
          size={16}
          iconType="stroked"
          accessibilityLabel={description}
          testID={testID}
          appearance="base"
        />
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
