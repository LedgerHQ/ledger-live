import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#ff2f67";
function YAE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M20.119 14.122l-4.162 8.5h-5.863l4.162-8.5-2.082-4.246h5.866zM9.744 9.878l4.16-8.5H8.04l-4.16 8.5 2.08 4.248h5.864z" }));
}
YAE.DefaultColor = DefaultColor;
export default YAE;
//# sourceMappingURL=YAE.js.map