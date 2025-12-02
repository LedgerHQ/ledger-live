import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00aced";
function CHAIN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M4.5 7.286v3.057l7.421 4.286 4.815-2.786v2.486l2.592 1.528V7.286l-7.413 4.286z", clipRule: "evenodd" }),
        React.createElement("path", { fillRule: "evenodd", d: "M11.915 3L4.5 7.286v8.571l7.415 4.286 7.392-4.286-2.621-1.528-4.771 2.757-4.793-2.757V8.814l4.793-2.757 4.771 2.757 2.621-1.529z", clipRule: "evenodd", opacity: 0.7 }));
}
CHAIN.DefaultColor = DefaultColor;
export default CHAIN;
//# sourceMappingURL=CHAIN.js.map