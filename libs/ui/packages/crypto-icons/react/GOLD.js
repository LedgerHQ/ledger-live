import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#F1B32B";
function GOLD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 3.188A8.812 8.812 0 003.187 12 8.812 8.812 0 0012 20.813a8.812 8.812 0 100-17.625zm0 15.427a6.615 6.615 0 110-13.23 6.615 6.615 0 010 13.23zm-2.197-6.607l2.204 3.3 2.19-3.3-2.19-3.308-2.204 3.308z" }));
}
GOLD.DefaultColor = DefaultColor;
export default GOLD;
