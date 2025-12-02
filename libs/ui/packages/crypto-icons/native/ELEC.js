import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#f90";
function ELEC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M8.285 20.845l9.5-9.977h-5.75z" }),
        React.createElement(Path, { d: "M6.215 13.857h5.75l5.82-2.99h-5.75z" }),
        React.createElement(Path, { d: "M14.848 3.155L6.215 13.857h5.75z" }));
}
ELEC.DefaultColor = DefaultColor;
export default ELEC;
//# sourceMappingURL=ELEC.js.map