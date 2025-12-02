import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#3c87c7";
function ARDR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M11.912 14.018l1.327 1.733-3.864 2.624zM12 5.624l2.045 3.355-5.454 9.395H4.5zm0 7.382l2.727-2.014 4.773 7.382h-3.409z", clipRule: "evenodd" }));
}
ARDR.DefaultColor = DefaultColor;
export default ARDR;
//# sourceMappingURL=ARDR.js.map