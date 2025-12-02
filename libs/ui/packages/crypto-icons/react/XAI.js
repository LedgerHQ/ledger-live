import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#ff4b2b";
function XAI({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12" }),
        React.createElement("path", { d: "M5.633 9v1.245L6.996 11.4l1.362-1.155V9h1.034v1.74l-1.59 1.34 1.59 1.34v1.74H8.358v-1.245L6.996 12.76l-1.363 1.155v1.245H4.6v-1.74l1.588-1.34L4.6 10.74V9zm8.294 0l1.297 1.328v4.832H14.19v-2.556h-2.725v2.556h-1.033v-4.832L11.728 9zm5.509 0v1.048h-1.16v4.064h1.16v1.048h-3.352v-1.048h1.159v-4.064h-1.16V9zm-5.937 1.048h-1.343l-.69.716v.792h2.724v-.792z" }));
}
XAI.DefaultColor = DefaultColor;
export default XAI;
//# sourceMappingURL=XAI.js.map