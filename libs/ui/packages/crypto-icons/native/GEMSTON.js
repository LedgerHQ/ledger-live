import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function GEMSTON({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M17.348 4.715l-.047-.048zm0 0l3.456 4.032a.5.5 0 01.013.635l-8.23 10.435a.503.503 0 01-.657.121.5.5 0 01-.132-.117L3.45 9.408a.5.5 0 01.016-.645L7.065 4.71a.5.5 0 01.476-.16m-.303 1.47l.853 2.576H4.952zM4.882 9.597h3.54l2.44 7.458zm8.668 7.386l5.843-7.41h-3.407zm.995-8.406l-2.35-2.762L9.86 8.592zm.885-.503L13.274 5.54h3zm.888.5l.845-2.537 2.174 2.536zm.719-4.028l-.07-.005H7.444m9.594.005a.5.5 0 01.264.122m-6.182.873H8.132l.845 2.55zM9.473 9.594l5.46-.02-2.74 8.334z", clipRule: "evenodd" }));
}
GEMSTON.DefaultColor = DefaultColor;
export default GEMSTON;
//# sourceMappingURL=GEMSTON.js.map