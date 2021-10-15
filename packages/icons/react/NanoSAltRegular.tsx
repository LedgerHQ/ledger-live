import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSAltRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.868 19.848L4.812 9.768l3.6-3.576 10.056 10.08c.6.552.816 1.2.816 1.848a2.53 2.53 0 01-2.544 2.544c-.648 0-1.296-.24-1.872-.816zM2.724 9.768L13.14 20.184v1.656h7.296v-9.912h.84V9.48h-.84V6.744h.84V4.296h-.84V2.16h-7.128V9l-4.92-4.896-5.664 5.664zm12.624 8.352c0 .744.6 1.416 1.416 1.416.768 0 1.368-.672 1.368-1.416 0-.768-.624-1.368-1.368-1.368-.816 0-1.416.6-1.416 1.368z"  /></Svg>;
}

export default NanoSAltRegular;