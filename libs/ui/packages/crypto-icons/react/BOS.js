import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00A8D6";
function BOS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M10.449 14.213v-1.438h2.216c1.477 0 2.216-.37 2.216-1.107V7.795c0-.737-.739-1.106-2.216-1.106H9.12v2.323H7.125V5.25h5.318c2.955 0 4.432.811 4.432 2.434v4.095c0 1.623-1.477 2.434-4.432 2.434h-1.994zm4.432.885h1.994v1.217c0 1.623-1.477 2.435-4.432 2.435H7.125v-8.631h5.318c.312 0 .607.009.887.027v1.44a6.843 6.843 0 00-.665-.03H9.12v5.755h3.545c1.478 0 2.217-.369 2.217-1.106v-1.107h-.001z" }));
}
BOS.DefaultColor = DefaultColor;
export default BOS;
