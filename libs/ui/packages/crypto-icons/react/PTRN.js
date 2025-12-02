import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#273658";
function PTRN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M5.19 10l-2.85 9.95h2.97L8.16 10zm10.55 2a2 2 0 00-2-2h-2.6l-1.15 4.01h3.75c1.11 0 2-.91 2-2.01m-2.01-7.94h-.89L13.9.36h-2.97l-1.06 3.7H4.19l-.85 2.97h10.4c2.74 0 4.98 2.23 4.98 4.98s-2.23 4.98-4.98 4.98h-4.6l-.85 2.97h5.45c4.38 0 7.95-3.56 7.95-7.95s-3.56-7.95-7.95-7.95zM4.25 23.64h2.97l1.06-3.69H5.31z", clipRule: "evenodd" }));
}
PTRN.DefaultColor = DefaultColor;
export default PTRN;
//# sourceMappingURL=PTRN.js.map