import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function LPT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M10.669 16.49h2.63v2.632h-2.63zm0-11.612h2.63V7.51h-2.63zm6.2 0H19.5V7.51h-2.631zm-12.369 0h2.631V7.51H4.5zm9.269 5.807h2.63v2.63h-2.63zm-6.207 0h2.631v2.63h-2.63z", clipRule: "evenodd" }));
}
LPT.DefaultColor = DefaultColor;
export default LPT;
//# sourceMappingURL=LPT.js.map