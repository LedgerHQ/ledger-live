import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function WEB3({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M5.655 4.21a.5.5 0 01.61-.357l13.417 3.51a.5.5 0 01.021.962L7.96 11.959l11.722 3.067a.5.5 0 01.021.961L6.287 20.14a.5.5 0 11-.296-.955l11.743-3.635-11.722-3.067a.5.5 0 01-.021-.96l11.743-3.636L6.012 4.821a.5.5 0 01-.357-.61", clipRule: "evenodd" }));
}
WEB3.DefaultColor = DefaultColor;
export default WEB3;
//# sourceMappingURL=WEB3.js.map