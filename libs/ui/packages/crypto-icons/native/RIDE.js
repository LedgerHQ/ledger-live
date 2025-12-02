import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#ae00ff";
function RIDE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M20 10.1V7.6h-2.3c-.8-1.7-2.5-2.8-4.6-2.8H6.8v2.8H4v2.3h2.8v1.5H4v2.3h2.8v5.4h3.1v-5.2h2.3l3.1 5.2h3.4l-3.2-5.4H20v-2.3h-2.5c.3-.5.3-1.1.5-1.5h2zm-7.1 1.4H9.7V7.6h3.2c1.2 0 2 .8 2 1.8 0 1.3-.7 2.1-2 2.1" }));
}
RIDE.DefaultColor = DefaultColor;
export default RIDE;
//# sourceMappingURL=RIDE.js.map