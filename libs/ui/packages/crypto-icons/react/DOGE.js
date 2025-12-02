import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#c3a634";
function DOGE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M9.56 10.958h3.236v1.714H9.561v3.613h2.04q1.213 0 1.984-.327t1.21-.908a3.3 3.3 0 00.598-1.361A8.6 8.6 0 0015.55 12a8.6 8.6 0 00-.157-1.689 3.3 3.3 0 00-.597-1.361q-.44-.58-1.211-.908-.773-.328-1.983-.327H9.56zm-2.074 1.714H6.375v-1.714h1.111V6h4.912q1.361 0 2.357.47a4.4 4.4 0 011.626 1.287q.63.814.937 1.907T17.625 12a8.6 8.6 0 01-.308 2.336 5.5 5.5 0 01-.937 1.908q-.63.814-1.625 1.286-.996.47-2.357.47H7.486z", clipRule: "evenodd" }));
}
DOGE.DefaultColor = DefaultColor;
export default DOGE;
//# sourceMappingURL=DOGE.js.map