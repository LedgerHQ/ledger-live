import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#516AFF";
function BAND({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M13.68 9.378l1.65.943V5.606l-3.3-1.65-5.127 2.888v10.253l5.127 2.947 5.067-3.005V11.97l-4.891-2.947-1.65.825 4.891 2.888.059 3.477-3.476 1.944-3.537-2.004V7.67l3.537-1.945 1.65.884v2.77z" }),
        React.createElement(Path, { d: "M11.853 12.206l1.12-.59 1.237.767-3.654 2.063v-4.243l1.297.766" }));
}
BAND.DefaultColor = DefaultColor;
export default BAND;
