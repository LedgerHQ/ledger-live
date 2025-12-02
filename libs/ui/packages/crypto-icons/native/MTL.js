import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#1e1f25";
function MTL({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M6 6.75h.75v10.5H6zM9.75 9h.75v6.75h-.75zm3.75 1.5h.75v3.75h-.75zm3.75-3.75H18v10.5h-.75z" }));
}
MTL.DefaultColor = DefaultColor;
export default MTL;
//# sourceMappingURL=MTL.js.map