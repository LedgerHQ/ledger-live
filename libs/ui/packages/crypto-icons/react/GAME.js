import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#2D475B";
function GAME({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M10.402 9.514h8.314v1.866h-8.314V9.514zm8.314 3.108h.034v4.907s-6.485 4.699-11.522-.414c0 0-2.76-2.8-1.76-6.876 0 0 .794-5.078 6.831-5.7 0 0 3.726-.52 6.14 2.245L16.992 8.2s-3.07-3.178-7.176-.69c0 0-3.346 1.866-1.966 6.564 0 0 1.518 4.077 6.278 3.248 0 0 1.622-.37 2.45-1.083v-1.751h-6.174v-1.866h8.313z" }));
}
GAME.DefaultColor = DefaultColor;
export default GAME;
