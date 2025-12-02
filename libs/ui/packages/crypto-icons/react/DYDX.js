import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function DYDX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 19 19", fill: color },
        React.createElement("path", { d: "M12.082 3.945L4.258 15.156H6.66l7.867-11.21zm-5.172 0l2.3 3.305-1.198 1.8-3.555-5.105zm5.406 11.215l-2.554-3.656 1.203-1.75 3.754 5.406zm0 0" }));
}
DYDX.DefaultColor = DefaultColor;
export default DYDX;
//# sourceMappingURL=DYDX.js.map