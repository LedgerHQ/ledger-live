import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#302c2c";
function GBYTE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5" }),
        React.createElement(Path, { d: "M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5" }));
}
GBYTE.DefaultColor = DefaultColor;
export default GBYTE;
//# sourceMappingURL=GBYTE.js.map