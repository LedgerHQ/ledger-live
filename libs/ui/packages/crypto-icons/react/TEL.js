import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#14c8ff";
function TEL({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M18.81 8.609c.475.384.774 1.18.669 1.764l-1.02 5.643c-.107.588-.669 1.236-1.248 1.439l-5.564 1.954c-.58.203-1.44.056-1.914-.329l-4.544-3.688c-.474-.384-.774-1.176-.667-1.764l1.02-5.643c.106-.588.668-1.235 1.248-1.439l5.565-1.954c.58-.204 1.44-.056 1.915.328zm-4.733 2.533l.226-1.147-2.124.003.3-1.512h-.686a4.3 4.3 0 01-2.061 1.67l-.193.988h.929s-.315 1.42-.42 1.945c-.263 1.335.397 2.282 1.411 2.282h1.716l.3-1.268H12.04c-.638 0-.604-.349-.48-.967l.395-1.997z" }));
}
TEL.DefaultColor = DefaultColor;
export default TEL;
//# sourceMappingURL=TEL.js.map