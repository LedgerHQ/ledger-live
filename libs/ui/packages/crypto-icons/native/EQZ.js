import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#3a4aff";
function EQZ({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M12 21a9 9 0 110-18 9 9 0 010 18M7.14 9.038c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957m4.856 3.873c-2.682 0-4.856-.428-4.856-.957s2.174-.957 4.856-.957 4.856.429 4.856.957c0 .529-2.174.957-4.856.957M7.14 14.963c0 .529 2.174.957 4.856.957s4.856-.428 4.856-.957-2.174-.957-4.856-.957-4.856.429-4.856.957", clipRule: "evenodd" }));
}
EQZ.DefaultColor = DefaultColor;
export default EQZ;
//# sourceMappingURL=EQZ.js.map