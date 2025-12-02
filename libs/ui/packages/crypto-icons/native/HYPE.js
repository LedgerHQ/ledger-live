import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#072723";
function HYPE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M24 11.95c0 7.934-4.856 10.48-7.414 8.213-2.106-1.848-2.732-5.754-5.9-6.155-4.02-.506-4.368 4.848-7.014 4.848C.592 18.856 0 14.374 0 12.072c0-2.354.661-5.563 3.29-5.563 3.062 0 3.236 4.586 7.065 4.342 3.812-.261 3.881-5.04 6.353-7.08C18.866 2.01 24 3.911 24 11.95" }));
}
HYPE.DefaultColor = DefaultColor;
export default HYPE;
//# sourceMappingURL=HYPE.js.map