import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#183c87";
function ZEL({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M3.75 12.086l3.371-1.903 3.37 1.903v3.636l-3.37 1.903-3.371-1.903zm9.758 0l3.37-1.903 3.372 1.903v3.636l-3.371 1.903-3.37-1.903zm-.354 3.158l-1.183.65-1.124-.617v-3.48L7.772 10.06V8.798l4.199-2.422 4.198 2.422v1.298l-3.016 1.702z", clipRule: "evenodd" }));
}
ZEL.DefaultColor = DefaultColor;
export default ZEL;
//# sourceMappingURL=ZEL.js.map