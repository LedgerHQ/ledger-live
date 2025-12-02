import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00dcfa";
function GUSD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M14.534 3.75c-2.903 0-5.368 2.232-5.678 5.105-2.875.31-5.106 2.776-5.106 5.678a5.72 5.72 0 005.717 5.717c2.902 0 5.377-2.232 5.677-5.105 2.874-.31 5.106-2.776 5.106-5.678a5.72 5.72 0 00-5.716-5.717m4.376 6.357a4.45 4.45 0 01-3.727 3.728v-3.728zM5.09 13.893a4.45 4.45 0 013.727-3.737v3.727H5.09zm8.754 1.29a4.42 4.42 0 01-4.377 3.776 4.42 4.42 0 01-4.377-3.775zm.049-5.076v3.776h-3.786v-3.776zm5.017-1.29h-8.754a4.42 4.42 0 014.377-3.776 4.42 4.42 0 014.377 3.775z" }));
}
GUSD.DefaultColor = DefaultColor;
export default GUSD;
//# sourceMappingURL=GUSD.js.map