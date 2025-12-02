import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#ffc018";
function HUC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M8.625 10.875h6.75V7.5h2.25v12h-2.25v-6.375h-6.75V16.5h-2.25v-12h2.25z", clipRule: "evenodd" }));
}
HUC.DefaultColor = DefaultColor;
export default HUC;
//# sourceMappingURL=HUC.js.map