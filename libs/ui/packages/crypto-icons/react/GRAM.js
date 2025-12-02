import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function GRAM({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M17.567 4.858H6.686c-2.001 0-3.27 2.158-2.263 3.903L11.14 20.4a1.14 1.14 0 001.975 0l6.717-11.64c1.005-1.742-.263-3.903-2.262-3.903zM11.134 16.91L9.67 14.08 6.142 7.768a.616.616 0 01.542-.922h4.448v10.066zm6.974-9.143l-3.527 6.314-1.463 2.83V6.844h4.448c.488 0 .775.518.542.922" }));
}
GRAM.DefaultColor = DefaultColor;
export default GRAM;
//# sourceMappingURL=GRAM.js.map