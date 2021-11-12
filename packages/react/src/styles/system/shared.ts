import {
  compose,
  space,
  color,
  layout,
  position,
  border,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  justifySelf,
  alignSelf,
  order,
  SpaceProps,
  ColorProps,
  LayoutProps,
  PositionProps,
  BorderProps,
  FlexProps,
  FlexGrowProps,
  FlexBasisProps,
  JustifySelfProps,
  AlignSelfProps,
  OrderProps,
} from "styled-system";
import gapsSystem from "./gaps";

export const sharedStyle = compose(
  space,
  color,
  layout,
  position,
  border,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  justifySelf,
  alignSelf,
  order,
  gapsSystem,
);
export type SharedStyleProps = SpaceProps &
  ColorProps &
  LayoutProps &
  PositionProps &
  BorderProps &
  FlexProps &
  FlexGrowProps &
  FlexBasisProps &
  JustifySelfProps &
  AlignSelfProps &
  OrderProps & {
    columnGap?: string | number;
    rowGap?: string | number;
  };
