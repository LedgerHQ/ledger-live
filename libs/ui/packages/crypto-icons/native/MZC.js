import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#ffaa05";
function MZC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M12.608 9.05v1.397h1.66l-.75.861h-1.115v1.083h1.16l-.568.86h-.591v2.209l-.955 1.302v-3.51h-1.32l.728-.861h.592v-1.083H9.584l.75-.86h1.115V9q-.825-.893-2.275-.893c-1.854 0-3.321 1.977-3.321 3.942q0 1.964.899 3.333l-1.035 1.203Q4.5 14.783 4.5 12.468c0-3.39 2.918-5.343 4.98-5.343q1.896 0 2.903 1.588 1.928-1.323 3.945-1.323c2.058 0 3.172 2.512 3.172 4.912 0 3.194-2.15 4.427-2.934 4.57a.16.16 0 01-.154-.06.146.146 0 01.039-.208q1.82-1.224 1.82-3.75c0-3.676-1.887-4.526-3.275-4.526a4.27 4.27 0 00-2.388.722", clipRule: "evenodd" }));
}
MZC.DefaultColor = DefaultColor;
export default MZC;
//# sourceMappingURL=MZC.js.map