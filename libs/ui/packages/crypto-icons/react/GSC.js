import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#ff0060";
function GSC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M18.86 9.093H12a2.907 2.907 0 102.72 3.918H12a.767.767 0 01-.768-.767v-.093a.767.767 0 01.768-.767h4.535q.05.317.046.639A4.58 4.58 0 1112 7.419l.14-.024q.044.02.093.024h4.07c2.22 0 3.127-1.186 3.127-2.86H12a7.443 7.443 0 107.442 7.477v-2.35a.58.58 0 00-.581-.593" }));
}
GSC.DefaultColor = DefaultColor;
export default GSC;
//# sourceMappingURL=GSC.js.map