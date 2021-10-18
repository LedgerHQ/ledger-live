import {
  flexbox,
  SpaceProps,
  FlexboxProps as FlexProps,
  compose,
  PositionProps,
  space,
  position,
} from "styled-system";
import styled from "styled-components";
import gapsSystem from "../../../styles/system/gaps";

export type FlexBoxProps = FlexProps &
  SpaceProps &
  PositionProps & { columnGap?: string | number; rowGap?: string | number };

const FlexBox = styled.div<FlexBoxProps>`
  display: flex;
  ${flexbox}
  ${space}
  ${position}
  ${compose(gapsSystem, flexbox)}
`;

export default FlexBox;
