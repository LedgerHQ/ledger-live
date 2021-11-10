import {
  flexbox,
  SpaceProps,
  FlexboxProps as FlexProps,
  compose,
  PositionProps,
  space,
  position,
  color,
  ColorProps,
  layout,
  LayoutProps,
} from "styled-system";
import styled from "styled-components";
import gapsSystem from "../../../styles/system/gaps";

export interface FlexBoxProps
  extends FlexProps,
    SpaceProps,
    PositionProps,
    ColorProps,
    LayoutProps {
  columnGap?: string | number;
  rowGap?: string | number;
  color?: string;
}

const FlexBox = styled.div<FlexBoxProps>`
  display: flex;
  ${flexbox};
  ${space};
  ${position};
  ${compose(gapsSystem, flexbox)};
  ${color};
  ${layout};
`;

export default FlexBox;
