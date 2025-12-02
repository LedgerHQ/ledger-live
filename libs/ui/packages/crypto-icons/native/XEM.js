import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#67b2e8";
function XEM({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M4.608 8.216A15 15 0 014.5 6.477a15.17 15.17 0 017.81-1.974c.426.009 1.043.056 1.51.106a4.5 4.5 0 00-2.376 3.884 4 4 0 01-.135 1.014 3.397 3.397 0 01-6.352.504 1 1 0 01-.075-.225 15 15 0 01-.274-1.57m12.46 6.42q-.268.415-.564.814a4.4 4.4 0 00-.547-2.168 4.45 4.45 0 00-1.61-1.697l-.067-.042-.112-.067q-1.28-.812-1.556-2.28A3.39 3.39 0 0115.15 5.28a3.36 3.36 0 011.827.062c.465.147.934.338 1.506.606.33.155.663.327 1.017.528a15 15 0 01-.339 3.11 15.1 15.1 0 01-2.092 5.049M14.79 17.39A15.4 15.4 0 0112 19.5q-.39-.225-.762-.48a15.3 15.3 0 01-5.466-6.542 4.52 4.52 0 004.525.009c.394-.224.83-.37 1.28-.426a3.39 3.39 0 013.676 2.404q.375 1.261-.212 2.48c-.033.07-.062.125-.13.258l-.032.065a.4.4 0 01-.089.122", clipRule: "evenodd" }));
}
XEM.DefaultColor = DefaultColor;
export default XEM;
//# sourceMappingURL=XEM.js.map