import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2A3069";
function HT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M13.85 8.437c0-2.64-1.28-4.88-2.24-5.6 0 0-.08-.08-.08.08-.08 5.04-2.64 6.4-4 8.32-3.28 4.24-.24 8.96 2.88 9.84 1.76.48-.4-.88-.64-3.68-.4-3.52 4.08-6.08 4.08-8.96z" }),
        React.createElement(Path, { d: "M15.53 10.197c-.16.64-.8 2-1.68 3.28-2.96 4.24-1.28 6.32-.32 7.44.56.64 0 0 1.36-.64.08-.08 2.72-1.44 2.96-4.56.32-3.04-1.6-4.96-2.32-5.52z" }));
}
HT.DefaultColor = DefaultColor;
export default HT;
