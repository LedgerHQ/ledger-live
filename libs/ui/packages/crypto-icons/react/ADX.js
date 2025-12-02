import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#1b75bc";
function ADX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M8.69 6.452L12 9.906l3.229-3.455L17.25 8.52 13.953 12l3.297 3.452-2.021 2.095L12 14.094l-3.31 3.453-1.94-2.037 3.27-3.53-3.27-3.46zm.267-.282L11.987 3l3.03 3.17-1.595 1.698-1.436-1.585-1.435 1.585zm0 11.66l1.594-1.698 1.435 1.585 1.436-1.585 1.595 1.698-3.03 3.17z", clipRule: "evenodd" }));
}
ADX.DefaultColor = DefaultColor;
export default ADX;
//# sourceMappingURL=ADX.js.map