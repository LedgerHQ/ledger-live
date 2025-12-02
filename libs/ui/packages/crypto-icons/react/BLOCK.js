import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#101341";
function BLOCK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M8.266 5.25h7.672L19.875 12l-3.937 6.75h-7.74l3.87-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12 14.58 7.625z", clipRule: "evenodd" }),
        React.createElement("path", { fillRule: "evenodd", d: "M9.085 8.27L6.908 12l2.157 3.698-1.379 2.406L4.125 12l3.592-6.158z", clipRule: "evenodd", opacity: 0.5 }),
        React.createElement("path", { fillRule: "evenodd", d: "M8.266 5.25h7.672L19.875 12l-3.937 6.75h-7.74l3.87-6.75zm4.073 2.375L14.852 12l-2.512 4.375h2.24L17.093 12 14.58 7.625z", clipRule: "evenodd" }),
        React.createElement("path", { fillRule: "evenodd", d: "M9.085 8.27L6.908 12l2.157 3.698-1.379 2.406L4.125 12l3.592-6.158z", clipRule: "evenodd", opacity: 0.5 }));
}
BLOCK.DefaultColor = DefaultColor;
export default BLOCK;
//# sourceMappingURL=BLOCK.js.map