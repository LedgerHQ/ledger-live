import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function GLINT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12.127 3.067l.146.94a9.4 9.4 0 007.847 7.847l.94.146-.94.146a9.4 9.4 0 00-7.847 7.847l-.146.94-.146-.94a9.4 9.4 0 00-7.847-7.847L3.194 12l.94-.146a9.4 9.4 0 007.847-7.847z" }));
}
GLINT.DefaultColor = DefaultColor;
export default GLINT;
//# sourceMappingURL=GLINT.js.map