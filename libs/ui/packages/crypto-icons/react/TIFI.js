import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00a3ff";
function TIFI({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M1.116 15.163L8.93 7.349h3.349l2.79 2.79-1.674 1.675-2.79-2.79-6.14 6.139zm7.814-1.117l1.675-1.674 2.79 2.79 6.14-6.139h3.349l-7.814 7.814h-3.35z" }));
}
TIFI.DefaultColor = DefaultColor;
export default TIFI;
//# sourceMappingURL=TIFI.js.map