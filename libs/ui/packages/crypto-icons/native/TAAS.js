import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#002342";
function TAAS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M3 9.75h.974v.916H3zm.974 3.58h2.832v.92H3v-2.668h2.858v.914H3.974zm13.22-1.748H21v2.668h-2.858v-.92h1.884v-.833h-2.832zm2.848-.872h-2.85v-.916h2.85zm-12.308.871h3.806v1.789h-.948v.88H7.734zm2.833 1.75v-.834h-1.86v.833zM7.734 9.75h3.806v.916H7.734zm4.75 1.832h3.807v1.787h-.948v.881h-2.858zm2.83 1.749v-.834h-1.86v.833zm-2.83-3.581h3.807v.916h-3.806z" }));
}
TAAS.DefaultColor = DefaultColor;
export default TAAS;
//# sourceMappingURL=TAAS.js.map