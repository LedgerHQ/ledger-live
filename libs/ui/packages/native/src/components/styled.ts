import styled from "styled-components/native";

import {
  compose,
  flexbox,
  FlexboxProps,
  space,
  SpaceProps,
  position,
  PositionProps,
  color,
  ColorProps,
  layout,
  LayoutProps,
  overflow,
  OverflowProps,
  border,
  BorderProps,
  background,
  BackgroundProps,
} from "styled-system";

export type BaseStyledProps = SpaceProps &
  FlexboxProps &
  PositionProps &
  ColorProps &
  LayoutProps &
  OverflowProps &
  BorderProps &
  BackgroundProps & {
    columnGap?: string | number;
    rowGap?: string | number;
    color?: string;
    display?: string;
    position?: string;
    maxHeight?: string | number;
  };

export const baseStyles = compose(
  flexbox,
  space,
  position,
  color,
  layout,
  overflow,
  border,
  background,
);

const proxyStyled = new Proxy(styled, {
  apply(target: typeof styled, thisArg, argumentsList: Parameters<typeof styled>) {
    return styled(target.apply(thisArg, argumentsList)(baseStyles));
  },
  get(target, property: keyof typeof styled) {
    if (typeof target[property] === "function") {
      return styled(target[property].apply(styled, [baseStyles]));
    }
    return target[property];
  },
});

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default proxyStyled as typeof styled;
