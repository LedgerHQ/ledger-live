import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#1c347a";
function OMNI({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M7.549 5.166a8.2 8.2 0 00-2.393 2.397V5.166zm11.253 2.332a8.2 8.2 0 00-2.35-2.332h2.35zm-2.316 11.313a8.2 8.2 0 002.316-2.31v2.31zm-11.33-2.374a8.2 8.2 0 002.358 2.374H5.156zM19.5 12c0 4.136-3.364 7.5-7.5 7.5-4.135 0-7.5-3.364-7.5-7.5 0-4.135 3.364-7.5 7.5-7.5s7.5 3.364 7.5 7.5M12 17.469A5.476 5.476 0 0017.469 12 5.476 5.476 0 0012 6.531 5.476 5.476 0 006.531 12 5.476 5.476 0 0012 17.469" }));
}
OMNI.DefaultColor = DefaultColor;
export default OMNI;
//# sourceMappingURL=OMNI.js.map