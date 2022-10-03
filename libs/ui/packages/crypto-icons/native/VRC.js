import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#418BCA";
function VRC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M15.199 5.25h3.551L12 18.75 5.25 5.25h3.528l3.245 6.835L15.2 5.25zM12 8.97c-.591 0-1.07-.493-1.07-1.1 0-.606.479-1.099 1.07-1.099.591 0 1.07.493 1.07 1.1 0 .606-.48 1.098-1.07 1.098zM16.849 12c.59 0 1.07.492 1.07 1.099s-.48 1.098-1.07 1.098c-.591 0-1.07-.491-1.07-1.098 0-.607.479-1.099 1.07-1.099z" }));
}
VRC.DefaultColor = DefaultColor;
export default VRC;
