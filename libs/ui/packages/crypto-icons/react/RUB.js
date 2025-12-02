import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#64d1ff";
function RUB({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M7.5 11.429h1.323V5.25h3.41q.949 0 1.733.223.783.223 1.342.678.558.455.875 1.152t.317 1.666-.335 1.685c-.211.46-.523.868-.914 1.19a3.8 3.8 0 01-1.36.708 6 6 0 01-1.695.232h-1.883v1.957h3v1.278h-3v2.731h-1.49v-2.73H7.5v-1.28h1.323v-1.956H7.5zm4.733 0q1.286 0 2.021-.61.737-.611.737-1.85t-.736-1.801-2.022-.563h-1.92v4.823z", clipRule: "evenodd" }));
}
RUB.DefaultColor = DefaultColor;
export default RUB;
//# sourceMappingURL=RUB.js.map