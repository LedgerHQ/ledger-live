import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function NIM({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { stroke: "#f8b425", strokeWidth: 2, d: "M18.96 11.852a.29.29 0 010 .295l-3.335 5.692a.3.3 0 01-.12.116.35.35 0 01-.17.045h-6.67a.35.35 0 01-.17-.045.3.3 0 01-.12-.116l-3.334-5.691a.29.29 0 010-.295L8.375 6.16a.3.3 0 01.12-.116.35.35 0 01.17-.045h6.67a.35.35 0 01.17.045q.077.046.12.116z" }));
}
NIM.DefaultColor = DefaultColor;
export default NIM;
//# sourceMappingURL=NIM.js.map