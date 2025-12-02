import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function SOX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M3.137 12.013a8.99 8.99 0 1117.98 0 8.99 8.99 0 01-17.98 0m8.99-7.99a7.99 7.99 0 100 15.98 7.99 7.99 0 000-15.98", clipRule: "evenodd" }),
        React.createElement("path", { d: "M8.957 10.203l-2.164 2.99c1.235 0 3.013.944 3.448 2.22l1.534-2.105c.241-.347.451-.618.963-.724l1.904-.381c.139-.977.054-2.837-.835-3.855-.318.057-1.238.204-2.539.354-1.428.165-1.881.946-2.311 1.501m5.685-2.013c.89 1.019.974 2.878.835 3.855l1.488-.315c.139-.976.054-2.836-.835-3.854zM6.42 14.078c1.289-.208 2.733.602 3.227 2.133-2.592 1.49-3.49-1.31-3.227-2.133" }));
}
SOX.DefaultColor = DefaultColor;
export default SOX;
//# sourceMappingURL=SOX.js.map