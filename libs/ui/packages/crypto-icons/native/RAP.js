import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function RAP({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M8.902 4.859v14.608H6.294V4.533h2.608v.326zm1.86-.326h1.466c3.033 0 5.055 1.923 5.055 4.662 0 2.218-1.207 3.914-3.392 4.468l3.815 5.804h-3.065L9.424 11.38h2.511c1.663 0 2.706-.75 2.706-2.217 0-1.468-1.042-2.218-2.706-2.218h-1.141V4.533h-.033z" }));
}
RAP.DefaultColor = DefaultColor;
export default RAP;
