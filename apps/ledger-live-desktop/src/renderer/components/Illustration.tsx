import styled from "styled-components";
// import { Box } from "@ledgerhq/react-ui";
import Box from "./Box"; // NOTE: Speedrun glitch

type Props = {
  lightSource: string;
  darkSource: string;
  size: number;
  height?: number;
};

const Illustration = styled(Box).attrs<Props>(p => ({
  width: `${p.size}px`,
  height: p.height ? `${p.height}px` : `${p.size}px`,
}))<Props>`
  background: url('${p =>
    p.theme.colors.palette.type === "light" ? p.lightSource : p.darkSource}');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;

export default Illustration;
