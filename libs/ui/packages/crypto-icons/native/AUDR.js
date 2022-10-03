import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#34318A";
function AUDR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M7.068 9.948l2.707 1.44 1.44-.72-3.442-1.865V5.52l6.618 3.435 1.44-.72-8.475-4.443a.634.634 0 00-.929.562v4.55c.002.44.25.843.64 1.044zm10.317-.764a.634.634 0 00-.72-.114l-9.597 4.982a1.18 1.18 0 00-.64 1.052v4.542a.634.634 0 00.928.562l9.576-4.968c.4-.207.648-.623.64-1.072V9.63a.626.626 0 00-.187-.447zm-1.152 4.904l-8.46 4.392v-3.284l8.46-4.391v3.283z" }));
}
AUDR.DefaultColor = DefaultColor;
export default AUDR;
