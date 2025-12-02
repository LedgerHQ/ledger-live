import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0dc9f7";
function WINGS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillOpacity: 0.2, d: "M14.178 11.432l-2.284 1.773-.935-3.244L5.541 8.51l7.11.365z" }),
        React.createElement(Path, { fillOpacity: 0.5, d: "M6.203 17.622L18.44 8.125l1.06 2.36-1.391-.385-.049 2.448z" }),
        React.createElement(Path, { d: "M17.097 12.963l-3.56-6.121L4.5 6.378l6.887 1.845 1.868 6.368z" }));
}
WINGS.DefaultColor = DefaultColor;
export default WINGS;
//# sourceMappingURL=WINGS.js.map