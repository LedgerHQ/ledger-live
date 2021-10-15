import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingCartMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.116 17.664v-1.8H9.132l-.36-1.872H19.86l1.992-9.144H6.972L6.54 2.664H2.148v1.8h2.808l2.592 13.2h11.568zm-11.904 2.4a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248zm.12-13.416H19.5l-1.224 5.544H8.412l-1.08-5.544zm9.576 13.416a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default ShoppingCartMedium;