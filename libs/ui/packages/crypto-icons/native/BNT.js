import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000d2b";
function BNT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M11.571 4.714L8.182 6.7l3.389 1.986L15.023 6.7zm.557 10.6v3.972l4.603-2.626v-3.972zm3.453-7.366v3.972l-3.453 1.986V9.934zM7.269 11.92l3.453 1.986V9.934L7.269 7.948zm0 5.38l3.453 1.986v-3.971l-3.453-1.986z" }));
}
BNT.DefaultColor = DefaultColor;
export default BNT;
//# sourceMappingURL=BNT.js.map