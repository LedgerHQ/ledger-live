import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StorageLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.024c5.088 0 9-1.632 9-4.248v-9.6c0-2.592-3.768-4.2-9-4.2-5.064 0-9 1.608-9 4.2v9.6c0 2.616 3.84 4.248 9 4.248zm-7.8-4.248V14.16c1.392 1.296 4.272 2.088 7.8 2.088 3.48 0 6.384-.792 7.8-2.112v2.64c0 1.8-3.048 3.096-7.8 3.096-4.824 0-7.8-1.296-7.8-3.096zm0-4.728v-2.76c1.392 1.296 4.272 2.088 7.8 2.088 3.48 0 6.384-.792 7.8-2.088v2.76c0 1.704-3.072 3.048-7.8 3.048-4.8 0-7.8-1.32-7.8-3.048zm0-4.872C4.2 5.4 7.272 4.128 12 4.128c4.896 0 7.8 1.272 7.8 3.048 0 1.728-3.072 3.048-7.8 3.048-4.8 0-7.8-1.296-7.8-3.048z"  /></Svg>;
}

export default StorageLight;