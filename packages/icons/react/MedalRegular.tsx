import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MedalRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.9 13.776v7.944l5.088-2.856L17.1 21.72v-7.944c1.08-1.224 1.776-2.856 1.776-4.632 0-3.768-3.096-6.864-6.888-6.864S5.124 5.376 5.124 9.144c0 1.776.672 3.408 1.776 4.632zm-.216-4.632a5.306 5.306 0 015.304-5.304c2.928 0 5.328 2.376 5.328 5.304 0 2.952-2.4 5.328-5.328 5.328-2.928 0-5.304-2.376-5.304-5.328zm1.68 10.152v-4.344a6.636 6.636 0 003.624 1.08 6.636 6.636 0 003.624-1.08v4.344l-3.624-2.016-3.624 2.016z"  /></Svg>;
}

export default MedalRegular;