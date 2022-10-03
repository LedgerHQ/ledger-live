import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#4096D0";
function FUEL({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M19.149 7.5h-4.871l-1.445 3.623H8.278V9.257h4.555L13.5 7.5H6.601a.322.322 0 00-.324.32v3.302h-1.11L4.5 12.878h1.777v3.298c0 .179.147.324.329.324h3.338l.667-1.756H8.278v-1.867h3.777L10.611 16.5h2.222l1.556-3.623h4.785c.18 0 .326-.144.326-.321v-4.71a.349.349 0 00-.351-.346zm-1.538 3.345a.279.279 0 01-.28.277h-2.275l.777-1.864h1.496a.28.28 0 01.283.276v1.311z" }));
}
FUEL.DefaultColor = DefaultColor;
export default FUEL;
