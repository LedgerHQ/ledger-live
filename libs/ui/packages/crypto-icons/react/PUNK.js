import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function PUNK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M12.137 4.084a7.953 7.953 0 100 15.905 7.953 7.953 0 000-15.905m-8.953 7.952a8.953 8.953 0 1117.906 0 8.953 8.953 0 01-17.906 0", clipRule: "evenodd" }),
        React.createElement("path", { d: "M10.248 7.268H8.145V9.81H6.828v1.225h1.317v1.317H6.828v1.225h1.317v2.47h1.28v1.244h5.688v-1.244h1.28v-8.78H14.29v7.628h-4.042v-1.318h1.244v-1.225h-1.244v-1.317h1.244V9.81h-1.244z" }));
}
PUNK.DefaultColor = DefaultColor;
export default PUNK;
//# sourceMappingURL=PUNK.js.map