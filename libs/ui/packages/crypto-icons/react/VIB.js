import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#FF1F43";
function VIB({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M6.375 5.25h3.15l5.4 9.581V5.25h2.7v13.5h-3.6l-7.65-13.5z" }));
}
VIB.DefaultColor = DefaultColor;
export default VIB;
