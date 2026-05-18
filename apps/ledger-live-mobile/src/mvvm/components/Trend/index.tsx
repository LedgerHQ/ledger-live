import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TriangleUp, TriangleDown } from "@ledgerhq/lumen-ui-rnative/symbols";

type TrendColor = "success" | "error";

type Props = Readonly<{
  percentage: number;
  formattedChange?: string;
  timeLabel?: string;
  testID?: string;
}>;

export function Trend({ percentage, formattedChange, timeLabel, testID }: Props) {
  if (Number.isNaN(percentage) || percentage === 0) {
    return (
      <Text typography="body3" lx={{ color: "muted" }} testID={testID}>
        &minus;
      </Text>
    );
  }

  const isPositive = percentage > 0;
  const color: TrendColor = isPositive ? "success" : "error";
  const Icon = isPositive ? TriangleUp : TriangleDown;
  const iconTestID = testID ? `${testID}-icon-${isPositive ? "up" : "down"}` : undefined;

  return (
    <Box lx={rowStyle} testID={testID}>
      <Box lx={iconContainerStyle}>
        <Box lx={iconStyle} testID={iconTestID}>
          <Icon size={16} color={color} />
        </Box>
        <Text typography="body3" lx={{ color }}>
          {Math.abs(percentage).toFixed(2)}%
        </Text>
      </Box>
      {formattedChange != null && (
        <Text typography="body3" lx={{ color: "base" }}>
          {formattedChange}
        </Text>
      )}
      {timeLabel != null && (
        <>
          <Text typography="body3" lx={{ color: "muted" }}>
            {MIDDLE_DOT}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
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

const iconContainerStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s2",
};

const iconStyle: LumenViewStyle = {
  marginVertical: "-s2",
};
