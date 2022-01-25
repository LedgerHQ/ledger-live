import React from "react";
import styled from "styled-components";
import { color, layout, typography, ColorProps, LayoutProps, TypographyProps } from "styled-system";
import FlexBox from "../../layout/Flex";

export type Props = React.PropsWithChildren<{
  /* Header which will be displayed at the top of the Aside. */
  header: React.ReactNode;
  /* Optional footer which will be displayed at the bottom of the Aside. */
  footer?: React.ReactNode;
}> &
  React.ComponentProps<typeof Wrapper>;

interface ExtraWrapperProps extends ColorProps, LayoutProps, TypographyProps {}
const Wrapper = styled(FlexBox)<ExtraWrapperProps>`
  ${color}
  ${layout}
  ${typography}
`;

export default function Aside({ header, footer, children, ...props }: Props): JSX.Element {
  return (
    <Wrapper display="inline-flex" flexDirection="column" height="100vh" {...props}>
      {header}
      <FlexBox flex="auto" alignItems="center" justifyContent="center">
        {children}
      </FlexBox>
      {footer ?? null}
    </Wrapper>
  );
}
