import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CubeRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.988 22.248l8.904-5.184V6.936l-8.904-5.184-8.88 5.184v10.128l8.88 5.184zm-7.32-6.024V8.64l6.576 3.792v7.656l-6.576-3.864zm.696-8.88l6.624-3.84 6.624 3.84-6.624 3.816-6.624-3.816zm7.368 12.744v-7.656l6.6-3.792v7.584l-6.6 3.864z"  /></Svg>;
}

export default CubeRegular;