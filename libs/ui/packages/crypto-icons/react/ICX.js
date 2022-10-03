import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#1FC5C9";
function ICX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M8.472 16.854l1.623-1.623a3.75 3.75 0 005.136-5.136l1.623-1.623a6 6 0 01-8.382 8.382zm-1.326-1.326a6 6 0 018.382-8.382l-1.623 1.623a3.75 3.75 0 00-5.136 5.136l-1.623 1.623zM18 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-12 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" }));
}
ICX.DefaultColor = DefaultColor;
export default ICX;
