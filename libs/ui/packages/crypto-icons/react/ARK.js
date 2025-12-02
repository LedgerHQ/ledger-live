import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#f70000";
function ARK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M11.96 10.01l-8.21 8.658L11.997 5.25l8.253 13.5zm1.191 3.439h-2.566l1.32-1.452 1.246 1.465zm-4.95 2.383v-.018l1.456-1.49v-.007l4.44-.019 1.499 1.534z" }));
}
ARK.DefaultColor = DefaultColor;
export default ARK;
//# sourceMappingURL=ARK.js.map