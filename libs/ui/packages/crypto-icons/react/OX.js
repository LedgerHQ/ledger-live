import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#4392CD";
function OX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M12.643 18.75h-1.287c-.966 0-1.24-.895-1.24-1.58 0-.683.05-.993.05-1.302 0-.487-.247-1.705-.693-2.215-.869-.993-1.417-1.884-1.417-3.175-.755-.39-2.092-.75-2.606-1.335-.515-.586-.95-1.418-.95-2.607 0-.304.064-.733.194-1.286.296.925.752 1.56 1.367 1.905.901.505 1.917.88 2.784.88h6.31c.867 0 1.882-.376 2.784-.88.614-.345 1.071-.98 1.367-1.905.13.553.194.982.194 1.286 0 1.189-.435 2.02-.95 2.605-.514.586-1.85.945-2.607 1.335 0 1.293-.547 2.183-1.416 3.177-.446.51-.692 1.727-.692 2.214 0 .31.048.62.048 1.303 0 .684-.273 1.58-1.24 1.58z" }));
}
OX.DefaultColor = DefaultColor;
export default OX;
