import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2D2D2D";
function BURST({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M10.28 14.472L4.5 12.578h3.866l.383-1.833 3.433.003L13.04 6h3.454c2.339 0 3.287.941 2.936 2.884l-.075.416c-.204 1.132-.721 1.884-1.61 2.318.88.45 1.176 1.301.955 2.528l-.171.95c-.342 1.894-1.736 2.904-4 2.904h-3.655l.947-5.245h-1.148l-.393 1.717zm3.799-2.06l-.708 3.922h1.459c.865 0 1.346-.384 1.51-1.29l.183-1.014c.209-1.158-.192-1.618-1.327-1.618H14.08zm.857-4.747l-.618 3.423h1.06c.965 0 1.53-.412 1.703-1.372l.118-.65c.169-.935-.18-1.401-1.067-1.401h-1.196z" }));
}
BURST.DefaultColor = DefaultColor;
export default BURST;
