import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#5b6dee";
function SNT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M9.975 11.265a7 7 0 00-1.248.108c.339-3.135 2.952-5.51 6.063-5.51 1.905 0 3.21.934 3.21 2.864 0 1.931-1.567 2.864-3.852 2.864-1.687 0-2.485-.325-4.173-.325zm-.123 1.144c-2.285 0-3.852.933-3.852 2.864s1.305 2.864 3.21 2.864c3.111 0 5.724-2.374 6.063-5.51q-.62.111-1.248.108c-1.687 0-2.486-.326-4.173-.326" }));
}
SNT.DefaultColor = DefaultColor;
export default SNT;
//# sourceMappingURL=SNT.js.map