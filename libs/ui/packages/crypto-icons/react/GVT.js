import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#16b9ad";
function GVT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M19.5 8.77c0 4.056-3.365 7.355-7.5 7.355s-7.5-3.3-7.5-7.354q0-.448.056-.895h1.346a6 6 0 00-.067.895c0 3.334 2.766 6.047 6.166 6.047 3.244 0 5.911-2.47 6.15-5.591H8.61c.203 1.457 1.352 2.615 2.833 2.855 1.481.238 2.947-.498 3.616-1.815h1.444c-.656 1.891-2.467 3.163-4.504 3.165-2.623 0-4.756-2.092-4.756-4.662q0-.451.087-.895h12.115q.055.445.055.895" }));
}
GVT.DefaultColor = DefaultColor;
export default GVT;
//# sourceMappingURL=GVT.js.map