import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#ffc04e";
function TNB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M11.699 8.893h.002l-.023.097-.195.92h-.022l-1.285 5.465H8.542l1.31-5.464H7.653l-1.234 5.464H4.622l1.633-6.75h5.5zm3.105-.268h2.723c2.342.107 2.124 1.66 2.124 1.66h.599l-.218.643h-.545c-.162.59-1.252.911-1.252.911 1.252.161 1.198 1.125 1.198 1.125h.6l-.164.643h-.49c-.126.893-.917 1.326-1.567 1.533a4 4 0 01-1.215.182H13.17zM5.492 9.911H3.75l.327-1.286h1.742zm7.461 4.714l-1.416-3.322.6-2.57 1.415 3.16zm4.166-3.322a.74.74 0 00.52-.211.717.717 0 000-1.023.74.74 0 00-.52-.212h-1.061l-.327 1.446zm-.367 2.786c.488 0 .884-.372.884-.83 0-.459-.393-.83-.884-.83h-1.276l-.394 1.66z" /></Svg>;
}
TNB.DefaultColor = DefaultColor;
export default TNB;