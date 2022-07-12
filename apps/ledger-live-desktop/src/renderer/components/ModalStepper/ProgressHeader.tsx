import React from "react";
import styled from "styled-components";

import { Box, Flex, Text } from "@ledgerhq/react-ui";

const HeaderText = styled(Text).attrs({
  ff: "Inter|Medium",
  color: "neutral.c80",
})``;

const HeaderTextSeparator = styled(Box).attrs({
  width: "2.36px",
  height: "2.36px",
  left: "47.67px",
  top: "5.83px",
  margin: "0px 8px",
  backgroundColor: "neutral.c80",
})`
  transform: rotate(45deg);
`;

export type ProgressHeaderProps = {
  title: string;
  stepIndex: number;
  stepCount: number;
};

const ProgressHeader = ({ title, stepIndex, stepCount }: ProgressHeaderProps) => (
  <Flex flexDirection="row" alignItems="center" mb="32px">
    <HeaderText variant="small">{title}</HeaderText>
    <HeaderTextSeparator />
    <HeaderText variant="small">
      {stepIndex + 1}/{stepCount}
    </HeaderText>
  </Flex>
);

export default ProgressHeader;
