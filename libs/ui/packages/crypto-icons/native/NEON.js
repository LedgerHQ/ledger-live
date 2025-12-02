import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#df42ab";
function NEON({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12M7.359 6.902l4.49 4.49V7.127a.32.32 0 01.322-.32h5.073a.32.32 0 01.316.32v5.015l.002.036v5.052a.322.322 0 01-.45.298.3.3 0 01-.11-.073H17l-4.49-4.49v4.265a.32.32 0 01-.32.323H7.12a.32.32 0 01-.323-.323v-5.052a.3.3 0 01.01-.077V7.127a.323.323 0 01.552-.225" }));
}
NEON.DefaultColor = DefaultColor;
export default NEON;
//# sourceMappingURL=NEON.js.map