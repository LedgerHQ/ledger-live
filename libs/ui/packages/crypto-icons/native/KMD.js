import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2b6680";
function KMD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M3.75 11.992a8.25 8.25 0 1016.5.032v-.063a8.3 8.3 0 00-.226-1.886.885.885 0 10-1.721.41 6.484 6.484 0 11-4.8-4.796.885.885 0 00.41-1.722A8.25 8.25 0 003.75 11.992" }),
        React.createElement(Path, { d: "M16.17 5.958q-.017.017-.03.036a1.3 1.3 0 00-.351.78v.14c0 .033-.007.064-.01.096a2.357 2.357 0 01-3.06 2.014 3.04 3.04 0 00-2.787.727c-.03.028-.063.052-.092.081a3.053 3.053 0 104.317 4.317 3 3 0 00.342-.416 3.05 3.05 0 00.467-2.453 2 2 0 01-.045-.166q-.002-.012-.007-.025a2.357 2.357 0 012.1-2.878c.017 0 .034-.005.051-.006.05 0 .1-.006.15-.006h.011c.305-.028.59-.162.806-.379q.078-.08.14-.171a1.315 1.315 0 00-2.001-1.69" }));
}
KMD.DefaultColor = DefaultColor;
export default KMD;
//# sourceMappingURL=KMD.js.map