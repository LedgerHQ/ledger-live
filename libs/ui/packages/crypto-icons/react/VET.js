import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#15BDFF";
function VET({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M11.053 17.8L5.279 6.035a.285.285 0 01.255-.41h2.001c.107 0 .208.06.255.154l4.217 8.536a1.024 1.024 0 001.839 0l4.203-8.529a.287.287 0 01.255-.154h.249c.148 0 .241.154.174.282L12.892 17.8a1.024 1.024 0 01-1.84 0z" }));
}
VET.DefaultColor = DefaultColor;
export default VET;
