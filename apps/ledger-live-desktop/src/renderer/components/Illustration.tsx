import styled from "styled-components";
import { Box } from "@ledgerhq/react-ui";

type Props = {
  lightSource: string;
  darkSource: string;
  size: number;
  height?: number;
};

const Illustration = styled(Box)<Props>`
  width: ${p => p.size}px;
  height: ${p => p.height || p.size}px;
  // prettier-ignore
  background: url('${p => (p.theme.theme === "light" ? p.lightSource : p.darkSource)}');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
`;

export default Illustration;
