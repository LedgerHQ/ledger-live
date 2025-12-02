import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#b49ffc";
function EMC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M6 6v2.4h4.8v2.4H6v2.4h7.2V8.4h2.4v7.2H6V18h12V6z", clipRule: "evenodd" }));
}
EMC.DefaultColor = DefaultColor;
export default EMC;
//# sourceMappingURL=EMC.js.map