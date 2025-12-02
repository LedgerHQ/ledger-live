import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#767dff";
function ACT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M10.328 5.25h3.345a.65.65 0 01.569.333l5.18 9.24a.65.65 0 010 .637l-1.658 2.956a.65.65 0 01-.569.334H6.805a.65.65 0 01-.57-.334L4.58 15.46a.65.65 0 010-.638l5.18-9.239a.65.65 0 01.569-.333M12 8.926L8.51 15.14h6.98z", clipRule: "evenodd" }));
}
ACT.DefaultColor = DefaultColor;
export default ACT;
//# sourceMappingURL=ACT.js.map