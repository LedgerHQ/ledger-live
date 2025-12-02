import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2c3e50";
function POLIS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M19.238 18.004v-.75c0-.148-.1-.247-.251-.247h-.499v-.753c0-.15-.1-.25-.248-.25h-.5v-5.51h.497c.15 0 .251-.099.251-.25v-.75h.499a.24.24 0 00.248-.201c.026-.125-.024-.224-.123-.276l-6.989-3.504a.35.35 0 00-.223 0L4.66 9.017a.25.25 0 00-.124.273c0 .127.1.204.223.204h.75v.75c0 .148.1.247.249.247h.5v5.512H5.76c-.15 0-.252.1-.252.248v.753H5.01c-.15 0-.25.099-.25.248v.752c-.148 0-.25.1-.25.251 0 .152.1.25.248.25h14.48c.148 0 .25-.098.25-.247 0-.15-.1-.254-.248-.254zM6.006 9.993v-.5h11.98v.5zm10.232.502v5.508h-.996v-5.509zm-2.496 0v5.508h-.998v-5.509zm-2.496 0v5.508h-.996v-5.509zm-2.496 0v5.508h-.995v-5.509zm9.237 6.509H6.009v-.502h11.98v.502z" }));
}
POLIS.DefaultColor = DefaultColor;
export default POLIS;
//# sourceMappingURL=POLIS.js.map