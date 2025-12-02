import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function NEAR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M17.448 3.914L13.685 9.5a.4.4 0 00.594.525l3.704-3.213a.15.15 0 01.25.114v10.058a.15.15 0 01-.265.096L6.773 3.679A1.92 1.92 0 005.309 3h-.391A1.92 1.92 0 003 4.917v14.165A1.92 1.92 0 004.918 21a1.92 1.92 0 001.635-.914l3.762-5.586a.4.4 0 00-.594-.525l-3.703 3.212a.15.15 0 01-.25-.113V7.014a.15.15 0 01.265-.097l11.193 13.404A1.92 1.92 0 0018.69 21h.391A1.92 1.92 0 0021 19.082V4.917A1.92 1.92 0 0019.083 3a1.92 1.92 0 00-1.635.914" }));
}
NEAR.DefaultColor = DefaultColor;
export default NEAR;
//# sourceMappingURL=NEAR.js.map