import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#98c23a";
function ILK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 3.158A8.843 8.843 0 1020.843 12 8.857 8.857 0 0012 3.158m0 16.5A7.65 7.65 0 1119.65 12 7.66 7.66 0 0112 19.65zm-3.908-8.445H6.667v-3.12q0-.878.833-.878h3.09a.75.75 0 01.863.877v3.12h-1.41V8.439h-1.95zm1.95.915h1.425v3.75a.75.75 0 01-.862.87H7.5a.75.75 0 01-.825-.886v-3.75h3.375zm5.85.052h1.44v3.75a.75.75 0 01-.87.87h-3.127a.75.75 0 01-.855-.87V8.16a.75.75 0 01.877-.878h3.076a.75.75 0 01.9.878v2.25h-1.5V8.505h-1.876v3.675z" }));
}
ILK.DefaultColor = DefaultColor;
export default ILK;
//# sourceMappingURL=ILK.js.map