import styled, { DefaultTheme, StyledComponent } from "styled-components";
import { Box } from "@ledgerhq/react-ui";
import { BoxProps } from "@ledgerhq/react-ui/components/layout/Box";

type Props = {
  lightSource: string;
  darkSource: string;
  size: number;
  height?: number;
};

const Illustration: StyledComponent<"div", DefaultTheme, BoxProps & Props> = styled(
  Box,
).attrs<Props>(p => ({
  width: `${p.size}px`,
  height: p.height ? `${p.height}px` : `${p.size}px`,
}))<Props>`
  // prettier-ignore
  background: url('${p =>
    p.theme.colors.palette.type === "light" ? p.lightSource : p.darkSource}');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;

export default Illustration;
