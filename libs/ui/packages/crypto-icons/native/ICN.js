import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#4C6F8C";
function ICN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M16 5.25h2v13.5h-2V5.25zM12.667 12h2v6.75h-2V12zM9.333 8.625h2V18.75h-2V8.625zM6 15.375h2v3.375H6v-3.375z" }));
}
ICN.DefaultColor = DefaultColor;
export default ICN;
