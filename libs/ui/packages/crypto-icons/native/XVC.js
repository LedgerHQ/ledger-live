import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#B50126";
function XVC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M6.838 8.057H5.25L6.498 6h3.1v8.038L15.537 6h3.214l-8.357 12H6.838V8.057z" }));
}
XVC.DefaultColor = DefaultColor;
export default XVC;
