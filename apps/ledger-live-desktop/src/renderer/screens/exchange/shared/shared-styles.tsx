import styled from "styled-components";
import Box from "~/renderer/components/Box";

import { colors } from "~/renderer/styles/theme";

export const IconWrapper = styled(Box)`
  background: ${colors.lightGreen};
  color: ${colors.positiveGreen};
  width: 50px;
  height: 50px;
  border-radius: 25px;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const WrapperClock = styled(Box).attrs(() => ({
  bg: "palette.background.paper",
  color: "palette.text.shade60",
}))`
  border-radius: 50%;
  position: absolute;
  bottom: -2px;
  right: -2px;
  padding: 2px;
`;
