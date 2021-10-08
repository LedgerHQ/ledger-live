import {
  flexbox,
  SpaceProps,
  FlexboxProps as FlexProps,
  compose,
  PositionProps,
} from "styled-system";
import styled from "styled-components";
import gapsSystem from "@ui/styles/system/gaps";
import { space, position } from "styled-system";

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
