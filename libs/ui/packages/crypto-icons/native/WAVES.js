import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0155ff";
function WAVES({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M12 4.5l7.5 7.5-7.5 7.5L4.5 12z", clipRule: "evenodd" }));
}
WAVES.DefaultColor = DefaultColor;
export default WAVES;
//# sourceMappingURL=WAVES.js.map