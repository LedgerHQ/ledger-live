import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#13A0F6";
function BELA({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6.327 9.096a1.817 1.817 0 01-.972-1.61 1.812 1.812 0 113.414-.85 6.668 6.668 0 013.376-.912c3.705 0 6.71 3.01 6.71 6.723s-3.004 6.723-6.71 6.723-6.71-3.01-6.71-6.723a6.705 6.705 0 01.892-3.35zm5.818 6.659c1.823 0 3.3-1.48 3.3-3.308a3.304 3.304 0 00-3.3-3.307 3.304 3.304 0 00-3.3 3.307 3.304 3.304 0 003.3 3.308z" }));
}
BELA.DefaultColor = DefaultColor;
export default BELA;
