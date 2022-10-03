import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#FF5000";
function BAT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M4.5 18.375l7.538-12.75L19.5 18.358l-15 .017zm7.52-7.59l-3.08 5.09h6.176l-3.096-5.09z" }));
}
BAT.DefaultColor = DefaultColor;
export default BAT;
