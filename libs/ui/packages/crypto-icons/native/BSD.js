import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function BSD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M21 11.386H3L13.473 7.87l1.472-4.828zM3.083 12.532h17.835l-10.473 3.436-1.472 4.991-5.891-8.427" }));
}
BSD.DefaultColor = DefaultColor;
export default BSD;
//# sourceMappingURL=BSD.js.map