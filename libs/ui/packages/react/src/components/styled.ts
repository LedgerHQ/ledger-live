import React from "react";
import gaps from "../styles/system/gaps";
import styled from "styled-components";
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
} from "styled-system";

export type BaseStyledProps = SpaceProps &
  FlexboxProps &
  PositionProps &
  ColorProps &
  LayoutProps &
  BorderProps &
  OverflowProps & {
    /**
     * The columnGap CSS property sets the size of the gap (gutter) between an element's grid columns.
     */
    columnGap?: string | number;
    /**
     * The rowGap CSS property sets the size of the gap (gutter) between an element's grid rows.
     */
    rowGap?: string | number;
    color?: string;
    children?: React.ReactNode;
  };

export const baseStyles = compose(flexbox, space, position, color, layout, overflow, gaps, border);

const proxyStyled = new Proxy(styled, {
  apply(target: typeof styled, thisArg, argumentsList: Parameters<typeof styled>) {
    return styled(target.apply(thisArg, argumentsList)(baseStyles));
  },
  get(target, property: keyof typeof styled) {
    if (typeof target[property] === "function") {
      return styled(Reflect.apply(target[property], styled, [baseStyles]));
    }
    return target[property];
  },
});

export default proxyStyled as typeof styled;
