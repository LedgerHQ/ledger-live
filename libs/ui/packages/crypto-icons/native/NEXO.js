import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#1A4199";
function NEXO({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { opacity: 0.7, d: "M8.047 4.987l8.05 4.643v4.74L3.79 7.263l3.95-2.276a.315.315 0 01.314 0" }),
        React.createElement(Path, { opacity: 0.9, d: "M16.096 4.893l-4.1 2.37 4.1 2.367V4.893z" }),
        React.createElement(Path, { d: "M16.096 4.893l3.948 2.277a.314.314 0 01.165.276v9.291l-4.113-2.367V4.893z" }),
        React.createElement(Path, { opacity: 0.9, d: "M20.201 16.737l-3.948 2.275a.33.33 0 01-.315 0L7.89 14.37V9.624l12.312 7.113z" }),
        React.createElement(Path, { opacity: 0.6, d: "M3.79 7.263v9.29a.315.315 0 00.165.277l3.95 2.277V9.624L3.79 7.264z" }),
        React.createElement(Path, { opacity: 0.7, d: "M7.897 19.106l4.1-2.369-4.1-2.367v4.736z" }));
}
NEXO.DefaultColor = DefaultColor;
export default NEXO;
