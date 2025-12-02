import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function JVT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M3.292 12c0-4.941 3.95-8.96 8.836-8.96 4.888 0 8.837 4.019 8.837 8.96s-3.95 8.96-8.837 8.96S3.292 16.942 3.292 12m8.836-7.96c-4.32 0-7.836 3.557-7.836 7.96s3.515 7.96 7.836 7.96c4.322 0 7.837-3.557 7.837-7.96s-3.515-7.96-7.837-7.96", clipRule: "evenodd" }),
        React.createElement("path", { d: "M12.564 7.39h-.788a.285.285 0 00-.285.285v8.624c0 .157.128.284.285.284h.788a.285.285 0 00.285-.284V7.675a.285.285 0 00-.285-.285" }));
}
JVT.DefaultColor = DefaultColor;
export default JVT;
//# sourceMappingURL=JVT.js.map