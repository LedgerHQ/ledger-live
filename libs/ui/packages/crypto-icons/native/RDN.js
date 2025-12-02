import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2a2a2a";
function RDN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M7.125 4.504h6.083c.074-.022.111.045.16.083a11 11 0 011.534 1.792 11.4 11.4 0 011.479 2.96 10 10 0 01.487 3.46h-3.101a4 4 0 00.016-.467c-.032-1.104-.372-2.186-.909-3.145-.573-1.026-1.374-1.912-2.285-2.648-.991-.802-2.107-1.435-3.27-1.946-.064-.03-.132-.054-.194-.089M9.376 10q1.56 2.823 3.117 5.65.377.68.75 1.362c-1.291.827-2.578 1.66-3.868 2.488V10z" }));
}
RDN.DefaultColor = DefaultColor;
export default RDN;
//# sourceMappingURL=RDN.js.map