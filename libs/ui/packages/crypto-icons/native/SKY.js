import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0072FF";
function SKY({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M18.02 10.352l-3.609 8.023H12.97l3.799-8.445c.438.071.86.214 1.252.422zM11.705 5.64L6.153 17.983c-1.416-.672-2.403-2.144-2.403-3.858 0-2.348 1.846-4.25 4.125-4.25 0-2.246 1.69-4.08 3.83-4.236zm4.42 4.236l-3.823 8.5h-1.563l4.802-10.672c.37.635.585 1.376.585 2.172zm1.421 8.237l2.45-5.442c.162.456.254.945.254 1.457 0 1.829-1.125 3.386-2.704 3.985zm1.082-7.36c.342.27.645.59.89.958l-2.99 6.644a3.751 3.751 0 01-.402.021h-.927l3.429-7.624zm-6.613-5.127c.585.002 1.14.13 1.643.36l-5.573 12.39h-.21a3.969 3.969 0 01-1.468-.283l5.608-12.467zm3.2 1.588l-5.021 11.162H8.509l5.496-12.214c.466.269.877.627 1.21 1.053z" }));
}
SKY.DefaultColor = DefaultColor;
export default SKY;
