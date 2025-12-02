import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function SCALE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12.043 12.001l-1.927 3.338H6.268l-1.926-3.336 1.926-3.336h3.85zM10.95 15.82l1.924 3.333h3.852l1.926-3.336-1.926-3.336h-3.848zm5.777-4.3h-3.851l-1.927-3.336 1.926-3.335h3.852l1.926 3.336z" }));
}
SCALE.DefaultColor = DefaultColor;
export default SCALE;
//# sourceMappingURL=SCALE.js.map