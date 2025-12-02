import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#0ebdcd";
function ETH({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M11.999 3.002v6.652l5.622 2.513z", opacity: 0.6 }),
        React.createElement("path", { d: "M11.999 3.002l-5.624 9.165 5.624-2.513z" }),
        React.createElement("path", { d: "M11.999 16.478v4.52l5.626-7.784z", opacity: 0.6 }),
        React.createElement("path", { d: "M11.999 20.998v-4.52l-5.624-3.264z" }),
        React.createElement("path", { d: "M11.999 15.432l5.622-3.265L12 9.656z", opacity: 0.2 }),
        React.createElement("path", { d: "M6.375 12.167l5.624 3.265V9.656z", opacity: 0.6 }));
}
ETH.DefaultColor = DefaultColor;
export default ETH;
//# sourceMappingURL=ETH.js.map