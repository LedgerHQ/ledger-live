import React, { memo } from "react";
import styled from "styled-components";

import Text from "@ui/components/asorted/Text";
import { BracketRight, BracketLeft } from "./Brackets";
import FlexBox, { FlexProps } from "@ui/components/layout/Flex";

export type Props = React.PropsWithChildren<FlexProps>;

const Container = styled(FlexBox)`
  justify-content: center;
  flex-wrap: wrap;
  align-items: stretch;
  min-height: ${(p) => p.theme.space[12]}px;
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
