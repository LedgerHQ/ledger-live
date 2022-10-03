import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#F4B728";
function ZEC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M11.322 14.884h4.723v2.513h-2.907c.049.719.073 1.385.121 2.103h-2.446v-2.078H7.906c0-.82-.096-1.64.05-2.41.072-.41.508-.769.774-1.127.921-1.151 1.85-2.297 2.785-3.436.364-.437.727-.847 1.139-1.333h-4.53V6.603h2.69V4.5h2.348v2.051h2.931c0 .846.097 1.667-.048 2.436-.073.41-.509.77-.799 1.128a347.378 347.378 0 01-2.786 3.436c-.365.456-.745.901-1.138 1.333z" }));
}
ZEC.DefaultColor = DefaultColor;
export default ZEC;
