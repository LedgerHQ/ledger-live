import styled from "styled-components";
import { sharedStyle, SharedStyleProps } from "../../../styles/system/shared";

export type BoxProps = React.HTMLAttributes<HTMLDivElement> & SharedStyleProps;

const Box = styled.div<BoxProps>`
  ${sharedStyle};
`;

export default Box;
