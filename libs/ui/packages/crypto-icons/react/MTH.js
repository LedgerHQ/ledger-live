import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function MTH({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillOpacity: 0.5, d: "M5.25 7.176l3.175 5.327V18c-1.753 0-3.175-1.377-3.175-3.076z" }),
        React.createElement("path", { fillOpacity: 0.6, d: "M15.574 12.497l3.174-5.324h.001v7.752c0 1.698-1.421 3.075-3.175 3.075z" }),
        React.createElement("path", { fillOpacity: 0.8, d: "M11.998 12.343l-1.588 2.664q-.494-.124-1.062-.958L5.25 7.175c1.519-.85 3.461-.345 4.338 1.125z" }),
        React.createElement("path", { d: "M14.412 8.295c.877-1.472 2.82-1.976 4.338-1.126l-4.098 6.874A3.2 3.2 0 0112 15.426c-.494 0-.98-.11-1.425-.326l-.165-.092z" }),
        React.createElement("path", { fillOpacity: 0.5, d: "M5.25 6.798l3.175 5.327v5.497c-1.753 0-3.175-1.377-3.175-3.076z" }),
        React.createElement("path", { fillOpacity: 0.6, d: "M15.574 12.119l3.174-5.324h.001v7.752c0 1.698-1.421 3.075-3.175 3.075z" }),
        React.createElement("path", { fillOpacity: 0.8, d: "M11.998 11.965l-1.588 2.664q-.494-.124-1.062-.958L5.25 6.797c1.519-.85 3.461-.345 4.338 1.125z" }),
        React.createElement("path", { d: "M14.412 7.917c.877-1.472 2.82-1.976 4.338-1.126l-4.098 6.874A3.2 3.2 0 0112 15.048c-.494 0-.98-.11-1.425-.326l-.165-.093z" }));
}
MTH.DefaultColor = DefaultColor;
export default MTH;
//# sourceMappingURL=MTH.js.map