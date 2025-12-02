import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#4c6f8c";
function ICN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M16 5.25h2v13.5h-2zM12.667 12h2v6.75h-2zM9.333 8.625h2V18.75h-2zM6 15.375h2v3.375H6z" }));
}
ICN.DefaultColor = DefaultColor;
export default ICN;
//# sourceMappingURL=ICN.js.map