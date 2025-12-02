import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function UP({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M16.512 5.77h-8.75l-4.558 4.558 8.932 8.933 8.933-8.933zm-4.375 2.856l-3.15 3.15 1.243 1.243 1.907-1.907 1.907 1.907 1.242-1.243z", clipRule: "evenodd" }));
}
UP.DefaultColor = DefaultColor;
export default UP;
//# sourceMappingURL=UP.js.map