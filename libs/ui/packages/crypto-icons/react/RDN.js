import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#2A2A2A";
function RDN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M7.125 4.504h6.083c.074-.022.111.045.16.083a11.164 11.164 0 011.534 1.792c.634.91 1.133 1.907 1.479 2.96a9.995 9.995 0 01.487 3.46h-3.101a3.73 3.73 0 00.016-.467c-.032-1.104-.372-2.186-.909-3.145-.573-1.026-1.374-1.912-2.285-2.648-.991-.802-2.107-1.435-3.27-1.946-.064-.03-.132-.054-.194-.089zM9.376 10c1.04 1.882 2.08 3.765 3.117 5.65.25.454.502.907.75 1.362-1.291.827-2.578 1.66-3.868 2.488V10h.001z" }));
}
RDN.DefaultColor = DefaultColor;
export default RDN;
