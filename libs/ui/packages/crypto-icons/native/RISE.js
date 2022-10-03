import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#F49352";
function RISE({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M9.454 6.866c-.643 0-1.164-.53-1.164-1.182 0-.654.521-1.184 1.164-1.184.643 0 1.164.53 1.164 1.184 0 .654-.52 1.182-1.164 1.182zM14.585 19.5a1.174 1.174 0 01-1.164-1.183c0-.653.522-1.183 1.164-1.183.644 0 1.165.53 1.165 1.183 0 .654-.521 1.183-1.165 1.183zm-4.653-8.842a1.035 1.035 0 01-1.467-.2A1.074 1.074 0 018.66 8.97l5.369-4.171a1.035 1.035 0 011.466.199 1.074 1.074 0 01-.195 1.49l-5.368 4.17zm.04 4.251a1.036 1.036 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49L9.97 14.909zm0 4.372a1.035 1.035 0 01-1.467-.199 1.074 1.074 0 01.195-1.49l5.369-4.17a1.035 1.035 0 011.466.198 1.074 1.074 0 01-.195 1.49L9.97 19.28z" }));
}
RISE.DefaultColor = DefaultColor;
export default RISE;
