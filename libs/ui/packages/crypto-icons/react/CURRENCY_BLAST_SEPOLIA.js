import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function CURRENCY_BLAST_SEPOLIA({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color },
        React.createElement("path", { d: "M12 4.188A7.81 7.81 0 004.188 12 7.81 7.81 0 0012 19.813 7.81 7.81 0 0019.813 12 7.81 7.81 0 0012 4.188M8.438 8.593h7.843c.06 0 .054.011.094.031l.938.813c.04.02.05.096.03.156l-.687 1.812c0 .04-.022.043-.062.063l-1.125.562c-.08.04-.091.16-.031.219l.718.75c.04.02.083.085.063.125l-.625 1.813a.2.2 0 01-.094.093l-1.562.75q-.031.03-.063.031H7.563c-.1 0-.197-.087-.157-.187l1.563-5.312c.04-.08.139-.103.219-.063l1 .563c.04.02.082.096.062.156l-.937 3.375c-.02.08.025.156.124.156h4.75c.06 0 .106-.034.126-.094l.5-1.531a.157.157 0 00-.157-.187H11.5c-.1 0-.165-.12-.125-.22l.313-.874c.02-.06.096-.094.156-.094h3.281c.06 0 .105-.034.125-.094l.406-1.219c.02-.1-.025-.187-.125-.187H7.125c-.14 0-.193-.201-.094-.281l1.313-1.094a.3.3 0 01.094-.031" }));
}
CURRENCY_BLAST_SEPOLIA.DefaultColor = DefaultColor;
export default CURRENCY_BLAST_SEPOLIA;
//# sourceMappingURL=CURRENCY_BLAST_SEPOLIA.js.map