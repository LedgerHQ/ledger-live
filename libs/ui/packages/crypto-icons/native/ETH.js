import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0EBDCD";
function ETH({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { opacity: 0.6, d: "M11.998 3.002v6.652l5.623 2.513L12 3.002z" }),
        React.createElement(Path, { d: "M11.998 3.002l-5.623 9.165 5.623-2.513V3.002z" }),
        React.createElement(Path, { opacity: 0.6, d: "M11.998 16.478v4.52l5.627-7.784-5.627 3.264z" }),
        React.createElement(Path, { d: "M11.998 20.998v-4.52l-5.623-3.264 5.623 7.784z" }),
        React.createElement(Path, { opacity: 0.2, d: "M11.998 15.432l5.623-3.265L12 9.656v5.776z" }),
        React.createElement(Path, { opacity: 0.6, d: "M6.375 12.167l5.623 3.265V9.656l-5.623 2.51z" }));
}
ETH.DefaultColor = DefaultColor;
export default ETH;
