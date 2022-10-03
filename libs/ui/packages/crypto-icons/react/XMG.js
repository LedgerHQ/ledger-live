import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function XMG({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593c-.39-.727-.722-1.27-.996-1.631-.273-.361-.517-.585-.731-.675a2.008 2.008 0 00-.626-.157 8.164 8.164 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554c.273 0 .523-.065.75-.195.226-.13.423-.294.588-.49.175-.203.33-.423.462-.655.142-.247.267-.503.373-.767l.556.17z" }),
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593c-.39-.727-.722-1.27-.996-1.631-.273-.361-.517-.585-.731-.675a2.008 2.008 0 00-.626-.157 8.164 8.164 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554c.273 0 .523-.065.75-.195.226-.13.423-.294.588-.49.175-.203.33-.423.462-.655.142-.247.267-.503.373-.767l.556.17z" }));
}
XMG.DefaultColor = DefaultColor;
export default XMG;
