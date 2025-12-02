import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#2ab6f6";
function LRC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M12 4.5l6.75 9.4L12 19.5l-6.75-5.6zm-.88 5l-2.935 4 2.935 2.4zm1.76 0v6.4l2.935-2.4z", clipRule: "evenodd" }));
}
LRC.DefaultColor = DefaultColor;
export default LRC;
//# sourceMappingURL=LRC.js.map