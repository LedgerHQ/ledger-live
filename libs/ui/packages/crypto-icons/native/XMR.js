import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#f60";
function XMR({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 3.893a8.112 8.112 0 017.7 10.692h-2.42v-6.82L12 13.045l-5.28-5.28v6.82H4.3a8.3 8.3 0 01-.418-2.574A8.11 8.11 0 0112 3.893m-1.21 10.339l1.232 1.211 1.21-1.21 2.288-2.31v4.29h3.41A8.1 8.1 0 0112 20.107a8.13 8.13 0 01-6.93-3.894h3.41v-4.29z" }));
}
XMR.DefaultColor = DefaultColor;
export default XMR;
//# sourceMappingURL=XMR.js.map