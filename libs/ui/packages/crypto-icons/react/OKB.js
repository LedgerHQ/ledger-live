import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#2d60e0";
function OKB({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 11.245A3.623 3.623 0 1012 4a3.623 3.623 0 000 7.245", opacity: 0.15 }),
        React.createElement("path", { d: "M16.378 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246", opacity: 0.4 }),
        React.createElement("path", { d: "M12 20a3.623 3.623 0 100-7.245A3.623 3.623 0 0012 20", opacity: 0.6 }),
        React.createElement("path", { d: "M7.623 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246", opacity: 0.85 }));
}
OKB.DefaultColor = DefaultColor;
export default OKB;
//# sourceMappingURL=OKB.js.map