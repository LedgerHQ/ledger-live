import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#272731";
function CDT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M18.75 12.023a8.26 8.26 0 01-2.39 5.818 8.12 8.12 0 01-5.77 2.409v-2.102c2.961.01 5.494-2.142 5.988-5.086h-2.917c.115-.342.174-.7.175-1.062a3.6 3.6 0 00-.175-1.062h2.917c-.501-2.94-3.03-5.088-5.988-5.087V3.75c4.506.043 8.141 3.729 8.16 8.273m-5.44 1.769h2.303c-.851 2.478-3.354 3.975-5.92 3.54-2.564-.437-4.443-2.676-4.443-5.3S7.129 7.17 9.694 6.734s5.067 1.061 5.92 3.54h-2.305a3.5 3.5 0 00-.986-.995 3.224 3.224 0 00-4.474.995 3.283 3.283 0 00.987 4.512 3.224 3.224 0 004.474-.995" /></Svg>;
}
CDT.DefaultColor = DefaultColor;
export default CDT;