import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#183C87";
function ZEL({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M3.75 12.086l3.371-1.903 3.37 1.903v3.636l-3.37 1.903-3.371-1.903v-3.636zm9.758 0l3.37-1.903 3.372 1.903v3.636l-3.371 1.903-3.37-1.903v-3.636h-.002zm-.354 3.158l-1.183.65-1.124-.617v-3.48L7.772 10.06V8.797l4.199-2.422 4.198 2.422v1.298l-3.016 1.702v3.447z" }));
}
ZEL.DefaultColor = DefaultColor;
export default ZEL;
