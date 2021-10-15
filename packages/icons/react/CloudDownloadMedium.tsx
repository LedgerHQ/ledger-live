import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloudDownloadMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.144 15.576v1.848c2.4-.36 4.2-2.352 4.2-4.8 0-2.4-1.728-4.248-3.936-4.704-.456-2.808-3.024-4.8-5.88-4.8-2.136 0-4.128 1.104-5.136 2.952-3 .048-5.736 2.448-5.736 5.688 0 2.448 1.56 4.584 3.96 5.4v-1.968a3.864 3.864 0 01-2.04-3.432c0-2.664 2.64-4.512 5.088-3.696.384-1.944 2.04-3.144 3.864-3.144 2.4 0 4.488 2.088 3.96 4.752 2.04-.432 3.936.888 3.936 2.952 0 1.416-.936 2.64-2.28 2.952zm-10.536.96l4.368 4.344 4.344-4.344-1.2-1.176-1.056 1.056c-.384.384-.792.816-1.176 1.248V11.52h-1.824v6.192c-.408-.456-.792-.888-1.2-1.296l-1.08-1.056-1.176 1.176z"  /></Svg>;
}

export default CloudDownloadMedium;