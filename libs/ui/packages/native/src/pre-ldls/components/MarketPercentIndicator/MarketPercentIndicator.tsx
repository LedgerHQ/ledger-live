import React from "react";
import { Flex, Text } from "../../../components";
import { useTokens } from "../../libs";
import { useTheme } from "styled-components/native";

const getPercentageDisplay = (percent: number, tokens: Record<string, unknown>) => {
  if (percent > 0) {
    return {
      backgroundColor: String(tokens["colors-surface-status-success-default"]),
      color: String(tokens["colors-surface-status-success-strong-default"]),
      text: `+${percent}%`,
    };
  }
  if (percent < 0) {
    return {
      backgroundColor: String(tokens["colors-surface-status-error-default"]),
      color: String(tokens["colors-surface-status-error-strong-default"]),
      text: `-${Math.abs(percent)}%`,
    };
  }
  return {
    backgroundColor: String(tokens["colors-surface-transparent-hover"]),
    color: String(tokens["colors-content-default-default"]),
    text: `${percent}%`,
  };
};

export const MarketPercentIndicator = ({ percent }: { percent: number }) => {
  const { theme } = useTheme();
  const colorType = theme;
  const tokens = useTokens(colorType, [
    "colors-surface-status-success-default",
    "colors-surface-status-success-strong-default",
    "colors-surface-status-error-default",
    "colors-surface-status-error-strong-default",
    "colors-surface-transparent-hover",
    "colors-content-default-default",
  ]);

  const percentageDisplay = getPercentageDisplay(percent, tokens);

  return (
    <Flex
      data-testid="market-percent-indicator"
      flexDirection="column"
      alignItems="flex-end"
      width="fit-content"
      p="4px"
      borderRadius="4px"
      backgroundColor={percentageDisplay.backgroundColor}
    >
      <Text color={percentageDisplay.color} fontSize="12px">
        {percentageDisplay.text}
      </Text>
    </Flex>
  );
};
