import React from "react";
import { Box, Text, Trend } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  percentage: number;
  formattedChange?: string;
  timeLabel?: string;
  testID?: string;
}>;

export function TrendSection({ percentage, formattedChange, timeLabel, testID }: Props) {
  if (Number.isNaN(percentage) || percentage === 0) {
    return (
      <Text typography="body2" lx={{ color: "muted" }} testID={testID}>
        &minus;
      </Text>
    );
  }

  return (
    <Box lx={rowStyle} testID={testID}>
      <Trend value={percentage} size="md" />
      {formattedChange != null && (
        <Text typography="body2" lx={{ color: "muted" }}>
          {formattedChange}
        </Text>
      )}
      {timeLabel != null && (
        <>
          <Text typography="body2" lx={{ color: "muted" }}>
            {MIDDLE_DOT}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {timeLabel}
          </Text>
        </>
      )}
    </Box>
  );
}

const MIDDLE_DOT = "·";

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s4",
};
