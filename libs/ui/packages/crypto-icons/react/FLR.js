import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function FLR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M20.9 4.3c0 2-1.6 3-3.7 3h-12c0-2 1.6-3 3.7-3zm-5.5 6.3c0 2-1.6 3-3.7 3H5.1c0-2 1.6-3 3.7-3zm-7.3 8.6c-.7.7-1.8.7-2.5 0s-.7-1.8 0-2.5 1.8-.7 2.5 0 .7 1.8 0 2.5" }));
}
FLR.DefaultColor = DefaultColor;
export default FLR;
//# sourceMappingURL=FLR.js.map