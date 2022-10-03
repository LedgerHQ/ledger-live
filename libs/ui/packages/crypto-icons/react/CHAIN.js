import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00ACED";
function CHAIN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M4.5 7.285v3.057l7.421 4.287 4.815-2.787v2.487l2.592 1.528V7.286l-7.413 4.286L4.5 7.286z" }),
        React.createElement("path", { opacity: 0.7, fillRule: "evenodd", clipRule: "evenodd", d: "M11.915 3L4.5 7.285v8.572l7.415 4.286 7.392-4.286-2.621-1.528-4.771 2.757-4.793-2.757V8.814l4.793-2.757 4.771 2.757 2.621-1.529L11.915 3z" }));
}
CHAIN.DefaultColor = DefaultColor;
export default CHAIN;
