import { flexbox, SpaceProps, FlexboxProps, compose, PositionProps } from "styled-system";
import styled from "styled-components";
import gapsSystem from "@ui/styles/system/gaps";
import { space, position } from "styled-system";

export interface FlexProps extends FlexboxProps, SpaceProps, PositionProps {}

const FlexBox = styled.div<FlexProps>`
  display: flex;
  ${flexbox};
  ${space}
  ${position}
  ${compose(gapsSystem, flexbox)}
`;

export default FlexBox;
