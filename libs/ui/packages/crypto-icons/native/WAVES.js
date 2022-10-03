import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0155FF";
function WAVES({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M12 4.5l7.5 7.5-7.5 7.5L4.5 12 12 4.5z" }));
}
WAVES.DefaultColor = DefaultColor;
export default WAVES;
