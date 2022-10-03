import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#408AF1";
function VIVO({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M17.287 6.957a1.18 1.18 0 011.642-.402c.563.352.74 1.102.395 1.677-1.278 2.129-2.72 4.356-3.923 6.057-1.755 2.483-2.135 3.336-3.401 3.336s-1.551-.753-3.356-3.342C7.57 12.745 6.226 10.686 4.69 8.256a1.235 1.235 0 01.356-1.686 1.18 1.18 0 011.652.363c1.517 2.402 4.945 7.407 5.31 7.854.383-.453 4.03-5.75 5.278-7.83z" }));
}
VIVO.DefaultColor = DefaultColor;
export default VIVO;
