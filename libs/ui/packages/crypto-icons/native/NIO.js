import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#70c9c9";
function NIO({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 11.448H8.383L12 5.25l3.617 6.198zm.491 7.302l1.886-3.232 1.809-3.098 3.689 6.33zm-2.868-3.232l1.886 3.232H4.125l3.69-6.33z" }));
}
NIO.DefaultColor = DefaultColor;
export default NIO;
//# sourceMappingURL=NIO.js.map