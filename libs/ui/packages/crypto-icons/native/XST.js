import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function XST({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M13.268 17.361l2.611-1.404L14.931 14l-1.663 3.361zm2.616-5.29l1.88 3.877.357.734-.718.386-5 2.689-.403.216-.403-.216-5-2.689-.717-.386.355-.733 1.88-3.878-1.877-3.797-.353-.714.69-.399 5-2.889.425-.245.425.245 5 2.89.69.398-.353.714-1.878 3.797zm-5.876-.008L12 7.956l1.992 4.107L12 16.091l-1.992-4.028zM9.07 14l-.95 1.957 2.612 1.404L9.07 14zm-.015-3.866l-.94-1.9L10.7 6.742l-1.645 3.393zM13.3 6.741l2.585 1.494-.94 1.9L13.3 6.74z" }));
}
XST.DefaultColor = DefaultColor;
export default XST;
