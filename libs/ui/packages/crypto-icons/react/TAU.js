import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#7b346e";
function TAU({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M6.07 10.259l1.583 1.582H4.5zm1.583 1.912l-1.582 1.57-1.571-1.57zm2.139-2.14l-1.582 1.57V8.45zm-1.912 1.57l-1.57-1.57L7.88 8.45zm2.14-1.809l-1.57-1.57h3.152zm0-3.482l1.582 1.582H8.45zm3.722-.228l-1.583 1.57V4.5zm-1.913 1.57l-1.57-1.57 1.57-1.582zM9.792 13.98L8.21 15.55v-3.152zm-3.482 0l1.57-1.582v3.153zm7.659-4.188l-1.57-1.57h3.152zm-1.57-1.9l1.57-1.583 1.582 1.582zm-.796 8.228l-1.583 1.57-1.57-1.57zm-1.583-1.913l1.582 1.583H8.45zm7.671-4.176l-1.582 1.57V8.45zm-3.482 0l1.57-1.582v3.153zm-3.95 7.898l1.57-1.581V19.5zm1.9-1.581l1.583 1.582-1.583 1.57zm1.81 1.342l-1.57-1.57h3.152zm0-3.482l1.583 1.582h-3.154zm2.14-1.81l1.583 1.583-1.583 1.57zm-1.9 1.583l1.57-1.583v3.153zm3.71-.24l-1.57-1.57H19.5zm0-3.482L19.5 11.84h-3.152z" }));
}
TAU.DefaultColor = DefaultColor;
export default TAU;
//# sourceMappingURL=TAU.js.map