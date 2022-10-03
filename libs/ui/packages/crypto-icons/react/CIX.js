import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#0576B4";
function CIX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M17.717 13.911l-.794-.497 1.733-.02.036-.02v.019l.715-.008-1.214 1.976-.109-.953-5.523 3.048-2.095-2.797-5.872 3.094v-.705l6.055-3.19 2.094 2.797 4.975-2.744zm-7.584-.679l-2.295 1.209V6.246h2.295v6.985zm6.49.361l-2.295 1.275V6.247h2.295v7.346z" }),
        React.createElement("path", { opacity: 0.5, d: "M13.378 15.396l-.492.273-1.803-2.408V7.184h2.295v8.212zm-6.49-.455L4.593 16.15V8.248h2.295v6.693z" }));
}
CIX.DefaultColor = DefaultColor;
export default CIX;
