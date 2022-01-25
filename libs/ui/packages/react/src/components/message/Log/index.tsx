import React, { memo } from "react";
import styled from "styled-components";

import Text, { TextProps } from "../../asorted/Text";
import FlexBox, { FlexBoxProps } from "../../layout/Flex";
import { BracketRight, BracketLeft } from "./Brackets";

export type Props = React.PropsWithChildren<
  FlexBoxProps & {
    extraTextProps?: TextProps;
  }
>;

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

function Log({ children, extraTextProps, ...props }: Props): JSX.Element {
  return (
    <Container color="neutral.c100" {...props}>
      <BracketLeft />
      <TextContainer flex="1" alignItems="center" justifyContent="center">
        <Text
          variant="h3"
          textTransform="uppercase"
          textAlign="center"
          color="inherit"
          {...extraTextProps}
        >
          {children}
        </Text>
      </TextContainer>
      <BracketRight />
    </Container>
  );
}

export default memo(Log);
