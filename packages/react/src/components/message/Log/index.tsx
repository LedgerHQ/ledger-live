import React, { memo } from "react";
import styled from "styled-components";

import Text from "../../asorted/Text";
import FlexBox, { FlexBoxProps } from "../../layout/Flex";
import { BracketRight, BracketLeft } from "./Brackets";

export type Props = React.PropsWithChildren<FlexBoxProps>;

const Container = styled(FlexBox)`
  justify-content: center;
  flex-wrap: wrap;
  align-items: stretch;
  min-height: ${(p) => p.theme.space[12]}px;
  color: ${(p) => p.theme.colors.palette.neutral.c100};
`;

const TextContainer = styled(FlexBox).attrs(() => ({
  flex: "1",
  justifyContent: "center",
  alignItems: "center",
}))`
  ${Text} {
    flex: 1;
  }
`;

function Log({ children, ...props }: Props): JSX.Element {
  return (
    <Container {...props}>
      <BracketLeft />
      <TextContainer flex="1" alignItems="center" justifyContent="center">
        <Text type="h3" textTransform="uppercase" textAlign="center">
          {children}
        </Text>
      </TextContainer>
      <BracketRight />
    </Container>
  );
}

export default memo(Log);
