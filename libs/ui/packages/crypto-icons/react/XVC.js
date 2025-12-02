import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#b50126";
function XVC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M6.839 8.057H5.25L6.498 6h3.1v8.038L15.537 6h3.214l-8.357 12H6.838z", clipRule: "evenodd" }));
}
XVC.DefaultColor = DefaultColor;
export default XVC;
//# sourceMappingURL=XVC.js.map