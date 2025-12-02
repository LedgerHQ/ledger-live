import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function HMMM({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M0 0h24v24H0z" }),
        React.createElement(Path, { d: "M12.01 8.43H8.53c-.53 0-.94.4-.94.94.01 1.75 0 3.5 0 5.25v.12c.03.55.57.93 1.09.78.4-.11.64-.44.64-.88v-3.69c0-.43.32-.8.73-.86.45-.06.86.19.98.62.04.15.02.31.04.46.01.11.02.22.05.33.13.39.46.58.91.58.4 0 .75-.29.83-.68.03-.14.02-.29.02-.44 0-.25.1-.47.29-.64.28-.24.6-.3.94-.15s.52.43.52.81v3.68c0 .2.05.37.16.53.22.32.62.45.99.33s.61-.45.61-.86V9.34c0-.54-.37-.91-.91-.91h-3.49zm.9 6.16v-.14c0-.46-.34-.84-.79-.88-.52-.05-.93.24-1.01.72-.02.12-.02.25-.02.38 0 .35.15.62.45.79.31.17.64.17.95-.02.32-.19.44-.49.42-.84z" }));
}
HMMM.DefaultColor = DefaultColor;
export default HMMM;
//# sourceMappingURL=HMMM.js.map