import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function EGLD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12.9 12L20 8.2l-1.2-2.3-6.5 2.6c-.2.1-.4.1-.5 0L5.2 5.9 4.1 8.2l7.1 3.8-7.1 3.8 1.2 2.3 6.5-2.6c.2-.1.4-.1.5 0l6.5 2.6 1.2-2.3z" }));
}
EGLD.DefaultColor = DefaultColor;
export default EGLD;
//# sourceMappingURL=EGLD.js.map