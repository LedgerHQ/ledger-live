import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#98C23A";
function ILK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 3.158A8.843 8.843 0 1020.843 12 8.857 8.857 0 0012 3.158zm0 16.5A7.65 7.65 0 1119.65 12 7.658 7.658 0 0112 19.65v.008zm-3.908-8.446H6.667v-3.12c0-.585.278-.877.833-.877h3.09a.75.75 0 01.863.877v3.12h-1.41V8.439h-1.95v2.774zm1.95.915h1.425v3.75a.751.751 0 01-.862.87H7.5a.749.749 0 01-.825-.884v-3.75h3.375l-.008.014zm5.85.053h1.44v3.75a.75.75 0 01-.87.87h-3.127a.75.75 0 01-.855-.87V8.16a.75.75 0 01.877-.878h3.076a.75.75 0 01.9.878v2.25h-1.5V8.505h-1.876v3.675h1.935z" }));
}
ILK.DefaultColor = DefaultColor;
export default ILK;
