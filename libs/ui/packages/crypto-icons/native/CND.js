import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#383939";
function CND({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M14.98 8.61l2-.459.775-1.276-.765-1.255-.98-.676-2.012-.444-1.241.7-1.986-.354-2.727 1.889-.213 2.206-1.157.483.134 2.047-.808.644.807 2.304.121.241.854 2.372 1.754.622 1.3 1.323 1.496.523.677-.195 1.073-.124 1.573-.45L18 17.406l-.613-2.424-1.181-.465-.588.672-1.654.407-2.405-.381-.776-.898.27-.878-1.137-1.8.956-1.166.102-1.984 1.37-.786.939-.375 1.274.23.423 1.05z" }));
}
CND.DefaultColor = DefaultColor;
export default CND;
