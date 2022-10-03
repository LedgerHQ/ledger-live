import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#5B6DEE";
function SNT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M9.975 11.265a6.862 6.862 0 00-1.248.108c.339-3.135 2.952-5.51 6.063-5.51 1.905 0 3.21.934 3.21 2.864 0 1.931-1.567 2.864-3.852 2.864-1.688 0-2.486-.325-4.173-.325v-.001zm-.123 1.144c-2.285 0-3.852.933-3.852 2.864 0 1.93 1.305 2.864 3.21 2.864 3.111 0 5.724-2.374 6.063-5.51-.412.074-.83.11-1.248.108-1.688 0-2.486-.326-4.173-.326z" }));
}
SNT.DefaultColor = DefaultColor;
export default SNT;
