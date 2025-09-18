import React from "react";
import { Flex, Text } from "../../../components";
import styled from "styled-components";
import { withTokens } from "../../libs";

const Wrapper = styled(Flex)`
  ${withTokens(
    "colors-surface-status-success-default",
    "colors-surface-status-success-strong-default",
    "colors-surface-status-error-default",
    "colors-surface-status-error-strong-default",
    "colors-surface-transparent-hover",
    "colors-content-default-default",
  )}
`;

const getPercentageDisplay = (percent: number) => {
  if (percent > 0) {
    return {
      backgroundColor: "var(--colors-surface-status-success-default)",
      color: "var(--colors-surface-status-success-strong-default)",
      text: `+${percent}%`,
    };
  }
  if (percent < 0) {
    return {
      backgroundColor: "var(--colors-surface-status-error-default)",
      color: "var(--colors-surface-status-error-strong-default)",
      text: `-${Math.abs(percent)}%`,
    };
  }
  return {
    backgroundColor: "var(--colors-surface-transparent-hover)",
    color: "var(--colors-content-default-default)",
    text: `${percent}%`,
  };
};

export const MarketPercentIndicator = ({ percent }: { percent: number }) => {
  const percentageDisplay = getPercentageDisplay(percent);

  return (
    <Wrapper
      data-testid="market-percent-indicator"
      flexDirection="column"
      alignItems="flex-end"
      width="fit-content"
      p="4px"
      borderRadius="4px"
      backgroundColor={percentageDisplay.backgroundColor}
    >
      <Text
        data-testid="market-percent-indicator-value"
        color={percentageDisplay.color}
        fontSize="12px"
      >
        {percentageDisplay.text}
      </Text>
    </Wrapper>
  );
};
