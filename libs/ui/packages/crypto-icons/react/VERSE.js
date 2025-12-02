import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function VERSE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M11.96 24c6.604 0 11.959-5.373 11.959-12S18.564 0 11.959 0 0 5.373 0 12s5.354 12 11.96 12m-.006-4.224L4.626 7.08h6.363l1.277 2.212h-3.78l4.767 8.234zm1.89-3.273l5.438-9.423h-2.595l-2.847 4.942-1-1.73h-2.588z", clipRule: "evenodd" }));
}
VERSE.DefaultColor = DefaultColor;
export default VERSE;
//# sourceMappingURL=VERSE.js.map