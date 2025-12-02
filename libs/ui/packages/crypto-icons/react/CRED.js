import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#37e8a3";
function CRED({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M9.102 11.975l2.611 2.62L18.562 7.7l.939.952-7.786 7.847-3.552-3.572zm1.582-.233L14.899 7.5l.94.953-4.213 4.245zm-1.707 3.622l-.927.935-3.55-3.572.938-.952z" }));
}
CRED.DefaultColor = DefaultColor;
export default CRED;
//# sourceMappingURL=CRED.js.map