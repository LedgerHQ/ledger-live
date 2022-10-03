import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0093DD";
function KCS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M9.78 12l3.88 3.997 2.449-2.522a1.084 1.084 0 011.566 0 1.165 1.165 0 010 1.614l-3.232 3.33a1.092 1.092 0 01-1.566 0l-4.662-4.805v2.856c0 .627-.5 1.142-1.108 1.142C6.495 17.612 6 17.1 6 16.47V7.53c0-.63.495-1.142 1.107-1.142S8.215 6.9 8.215 7.53v2.856l4.662-4.805a1.092 1.092 0 011.566 0l3.233 3.33a1.165 1.165 0 010 1.614 1.085 1.085 0 01-1.568 0L13.66 8.002 9.78 12zm3.882-1.143c.612 0 1.108.512 1.108 1.143 0 .63-.496 1.142-1.108 1.142-.612 0-1.109-.512-1.109-1.142 0-.631.497-1.143 1.109-1.143z" }));
}
KCS.DefaultColor = DefaultColor;
export default KCS;
