import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0DC9F7";
function WINGS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M14.178 11.432l-2.284 1.773-.935-3.244L5.541 8.51l7.11.365 1.527 2.557z", fillOpacity: 0.2 }),
        React.createElement(Path, { d: "M6.203 17.622l12.236-9.497 1.061 2.36-1.391-.385-.049 2.448-11.857 5.074z", fillOpacity: 0.5 }),
        React.createElement(Path, { d: "M17.097 12.963l-3.56-6.121L4.5 6.378l6.887 1.845 1.868 6.368 3.842-1.628z" }));
}
WINGS.DefaultColor = DefaultColor;
export default WINGS;
