import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#FFE600";
function WPR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M2.632 4.384A12.073 12.073 0 014.619 2.58L7.96 14.52 9.437 8.19h2.805l1.479 6.329 1.753-6.329h2.812l.026.113 3.055 11.035a12.071 12.071 0 01-1.912 2.082l-2.578-9.308-1.47 5.309-.026.112h-3.14l-1.402-5.199-1.402 5.2h-3.14l-.026-.113-3.64-13.037z" }));
}
WPR.DefaultColor = DefaultColor;
export default WPR;
