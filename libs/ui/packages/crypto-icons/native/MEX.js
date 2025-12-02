import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#3066ff";
function MEX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M17.6 10.3L10.3 20l1.3-6.3H6.4L13.7 4l-1.4 6.3z", clipRule: "evenodd" }));
}
MEX.DefaultColor = DefaultColor;
export default MEX;
//# sourceMappingURL=MEX.js.map