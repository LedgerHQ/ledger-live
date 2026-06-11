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
  // NaN signals missing data → neutral dash. A real 0 is rendered as a neutral
  // (grey) trend so the row (and its time label) stays visible, e.g. while
  // scrubbing back to the start of the range.
  if (Number.isNaN(percentage)) {
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
