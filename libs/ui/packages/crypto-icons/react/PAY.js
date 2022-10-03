import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#302C2C";
function PAY({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M20.183 11.772a.85.85 0 00-.162-.225c-1.426-1.616-4.33-4.797-4.33-4.797l-3.687 4.034-3.735-3.996s-2.937 3.21-4.376 4.842c-.188.185-.188.518-.02.714.748.852 4.42 4.902 4.42 4.902L12 13.186l3.68 4.064 4.437-4.91s.094-.097.114-.162a.558.558 0 00-.047-.406zm-14.244.45c-.12-.143-.08-.365.032-.5.47-.534 2.348-2.55 2.348-2.55l2.618 2.78-2.622 2.867s-1.605-1.713-2.376-2.598zm11.99.094c-.054.095-.119.184-.191.266l-2.033 2.209L13.08 12l2.583-2.831s1.488 1.541 2.17 2.37c.058.072.126.14.155.232.063.179.023.378-.059.544" }));
}
PAY.DefaultColor = DefaultColor;
export default PAY;
