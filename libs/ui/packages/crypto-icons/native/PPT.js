import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#152743";
function PPT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12.037 6.231c-.987 0-1.788-.55-1.788-1.228 0-.68.8-1.229 1.788-1.229.987 0 1.786.55 1.786 1.229 0 .678-.8 1.228-1.786 1.228zm-.925 13.713V6.822h3.984c.148 0 .252.11.252.258v7.281c0 .147-.105.273-.252.273H12.9v5.31c0 .148-.113.282-.26.282h-1.251a.287.287 0 01-.277-.281v-.001zm-.672-5.31H8.933a.284.284 0 01-.281-.274V7.08c0-.148.133-.258.28-.258h1.508v7.812z" }));
}
PPT.DefaultColor = DefaultColor;
export default PPT;
