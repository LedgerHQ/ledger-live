import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MapMarkerRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.68 16.344L12 22.128l4.32-5.784c1.656-2.232 3.024-4.512 3.024-7.008C19.32 4.728 15.792 1.872 12 1.872c-3.792 0-7.32 2.856-7.344 7.464 0 2.496 1.368 4.776 3.024 7.008zM6.216 9.336C6.24 5.664 9 3.432 12 3.432s5.76 2.232 5.784 5.904c0 2.016-1.128 3.96-2.712 6.072L12 19.512l-3.072-4.104c-1.56-2.112-2.712-4.056-2.712-6.072zM8.52 9.24c0 1.944 1.56 3.48 3.48 3.48s3.48-1.536 3.48-3.48c0-1.92-1.56-3.48-3.48-3.48S8.52 7.32 8.52 9.24zm1.392 0A2.09 2.09 0 0112 7.152c1.152 0 2.112.936 2.112 2.088 0 1.176-.96 2.112-2.112 2.112A2.095 2.095 0 019.912 9.24z"  /></Svg>;
}

export default MapMarkerRegular;