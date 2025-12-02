import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#48b254";
function SBERBANK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M17.01 5.151l.71.644-8.95 5.108L4.44 8.41l.404-.805 3.928 2.233zm-1.8-1.026l.95.483-7.39 4.224L5.33 6.88l.586-.703 2.855 1.629zm3.137 2.333l.526.704L8.77 12.936 3.893 10.16l.222-.885 4.657 2.656zm1.457 2.595q.447 1.248.446 2.615 0 1.369-.445 2.655l-.203.543a8.4 8.4 0 01-1.761 2.615 8.1 8.1 0 01-2.633 1.73 8.13 8.13 0 01-6.437 0 8.5 8.5 0 01-2.612-1.73 7.9 7.9 0 01-1.761-2.615 8.2 8.2 0 01-.648-3.198v-.543l5.02 2.836 10.59-6.034z", clipRule: "evenodd" }));
}
SBERBANK.DefaultColor = DefaultColor;
export default SBERBANK;
//# sourceMappingURL=SBERBANK.js.map