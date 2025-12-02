import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0050db";
function JNT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 19.5a2.7 2.7 0 01-1.383-.379l-3.98-2.34a2.84 2.84 0 01-1.387-2.445V9.663a2.85 2.85 0 011.388-2.444l3.979-2.34c.421-.248.9-.378 1.389-.379.484 0 .96.13 1.377.379l3.98 2.34a2.84 2.84 0 011.387 2.445v4.672a2.85 2.85 0 01-1.387 2.445l-3.98 2.34A2.7 2.7 0 0112 19.5m-2.289-4.822l-.737.75a2.02 2.02 0 001.467.617c1.148-.002 2.08-.948 2.081-2.118v-.638c.315.185.673.282 1.037.281a2 2 0 001.473-.609l-.736-.75c-.195.2-.46.313-.737.313a1.05 1.05 0 01-1.037-1.056V7.946h-1.037v5.988c0 .585-.464 1.058-1.038 1.058a1.03 1.03 0 01-.736-.314" }));
}
JNT.DefaultColor = DefaultColor;
export default JNT;
//# sourceMappingURL=JNT.js.map