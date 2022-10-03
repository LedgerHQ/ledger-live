import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#FFC018";
function HUC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M8.625 10.875h6.75V7.5h2.25v12h-2.25v-6.375h-6.75V16.5h-2.25v-12h2.25v6.375z" }));
}
HUC.DefaultColor = DefaultColor;
export default HUC;
