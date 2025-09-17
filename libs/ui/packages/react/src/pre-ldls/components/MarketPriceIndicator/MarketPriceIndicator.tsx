import React from "react";
import { Flex, Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";

const Wrapper = styled(Flex)`
  ${withTokens(
    "colors-surface-status-success-strong-default",
    "colors-surface-status-error-strong-default",
    "colors-content-default-default",
  )}
`;

const getPercentageDisplay = (percent: number) => {
  if (percent > 0) {
    return {
      color: "var(--colors-surface-status-success-strong-default)",
      text: `+${percent}%`,
    };
  }
  if (percent < 0) {
    return {
      color: "var(--colors-surface-status-error-strong-default)",
      text: `-${percent}%`,
    };
  }
  return {
    color: "var(--colors-content-default-default)",
    text: `${percent}%`,
  };
};

export const MarketPriceIndicator = ({ percent, price }: { percent: number; price: string }) => {
  const percentageDisplay = getPercentageDisplay(percent);

  return (
    <Wrapper
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
    </Wrapper>
  );
};
