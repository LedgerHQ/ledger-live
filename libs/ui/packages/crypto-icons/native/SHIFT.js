import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#964B9C";
function SHIFT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { opacity: 0.6, d: "M15.36 11.997l-3.354 3.353h6.706l-3.352-3.353z" }),
        React.createElement(Path, { opacity: 0.7, d: "M8.625 12l3.354-3.353H5.272L8.626 12z" }),
        React.createElement(Path, { opacity: 0.4, d: "M12.006 15.35l3.345-3.344-3.36-3.362-6.708 6.707 6.707 6.707 6.707-6.707H12.006z" }),
        React.createElement(Path, { opacity: 0.8, d: "M12.021 1.942L5.32 8.645h6.66l-3.334 3.334 3.376 3.376 6.707-6.706-6.707-6.707z" }));
}
SHIFT.DefaultColor = DefaultColor;
export default SHIFT;
