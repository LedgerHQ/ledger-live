import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#ef494d";
function TIX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M4.5 8.54c0-.16.13-.29.29-.29h3.77c1.738 0 2.826.897 2.826 2.164q0 .794-.725 1.442 1.014.578 1.014 1.73c0 1.804-1.74 2.164-2.899 2.164H4.79a.29.29 0 01-.29-.29v-.862c0-.16.13-.29.29-.29h3.985q1.233 0 1.233-.794 0-.792-1.233-.865H4.79a.29.29 0 01-.29-.289v-.862c0-.161.13-.29.29-.29h3.985q.87-.145.87-.722 0-.793-.87-.793H4.79a.29.29 0 01-.29-.29zm7.827 0c0-.16.13-.29.29-.29h3.84c.16 0 .29.13.29.29v6.92a.29.29 0 01-.29.29h-1.088a.29.29 0 01-.29-.29V9.983a.29.29 0 00-.289-.29h-2.175a.29.29 0 01-.29-.29zm5.433-.29h1.45c.16 0 .29.13.29.29v.862a.29.29 0 01-.29.29h-1.45a.29.29 0 01-.29-.29V8.54c0-.16.13-.29.29-.29", clipRule: "evenodd" }));
}
TIX.DefaultColor = DefaultColor;
export default TIX;
//# sourceMappingURL=TIX.js.map