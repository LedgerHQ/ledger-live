import React from "react";
import { useTokens } from "../../libs";
import { useTheme } from "styled-components/native";
import { Flex, Text } from "../../../components";

const getPercentageDisplay = (percent: number, tokens: Record<string, unknown>) => {
  if (percent > 0) {
    return {
      color: String(tokens["colors-surface-status-success-strong-default"]),
      text: `+${percent}%`,
    };
  }
  if (percent < 0) {
    return {
      color: String(tokens["colors-surface-status-error-strong-default"]),
      text: `-${Math.abs(percent)}%`,
    };
  }
  return {
    color: String(tokens["colors-content-default-default"]),
    text: `${percent}%`,
  };
};

export const MarketPriceIndicator = ({ percent, price }: { percent: number; price: string }) => {
  const { theme } = useTheme();
  const colorType = theme;
  const tokens = useTokens(colorType, [
    "colors-surface-status-success-strong-default",
    "colors-surface-status-error-strong-default",
    "colors-content-default-default",
  ]);

  const percentageDisplay = getPercentageDisplay(percent, tokens);

  return (
    <Flex
      data-testid="market-price-indicator"
      flexDirection="column"
      alignItems="flex-end"
      width="fit-content"
    >
      <Text variant="body" fontWeight="semiBold" mb="4px">
        {price}
      </Text>
      <Text color={percentageDisplay.color} fontSize="12px">
        {percentageDisplay.text}
      </Text>
    </Flex>
  );
};
