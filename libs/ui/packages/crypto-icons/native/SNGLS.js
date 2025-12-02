import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#b30d23";
function SNGLS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12.699 15.562L12 16.864l-.699-1.302c-4.222-.328-7.537-3.476-7.537-3.476 0-.008 3.22-3.059 7.357-3.461l.547-.938.332-.55.563.937.316.551c4.136.394 7.357 3.46 7.357 3.46s-3.315 3.149-7.538 3.477zm-8.236-3.476c-.007 0 3.185 2.18 6.391 2.642l-1.563-2.925.425-.737.39.73-.008.007 1.52 2.992q.184.01.368.008c.122 0 .237 0 .36-.008l1.117-2.226.814-1.518.425.737-1.563 2.932c3.206-.453 6.397-2.582 6.397-2.642 0-.053-3.04-2.084-6.167-2.605l.475.827-.396.795-1.03-1.726A8 8 0 0012 9.354q-.207.002-.425.015l-1.052 1.726-.389-.759.496-.855c-3.126.528-6.167 2.605-6.167 2.605" }));
}
SNGLS.DefaultColor = DefaultColor;
export default SNGLS;
//# sourceMappingURL=SNGLS.js.map