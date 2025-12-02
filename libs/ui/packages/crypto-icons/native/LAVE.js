import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function LAVE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M9.74 20.933V3.067h1v16.654l6.145-6.175.708.705-6.998 7.035a.5.5 0 01-.854-.353", clipRule: "evenodd" }),
        React.createElement(Path, { fillRule: "evenodd", d: "M6.662 12.897l6.834-6.83.707.707-6.834 6.83zm0 3.563l6.834-6.83.707.708-6.834 6.83z", clipRule: "evenodd" }));
}
LAVE.DefaultColor = DefaultColor;
export default LAVE;
//# sourceMappingURL=LAVE.js.map