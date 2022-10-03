import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#F7931E";
function PASC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12 3a9 9 0 100 18 9 9 0 000-18zm4.5 4.36a1.687 1.687 0 011.688 1.687v2.53a1.687 1.687 0 01-1.688 1.688h-2.09l-.135.633a.366.366 0 01-.34.282h-.422a.22.22 0 01-.222-.282l.136-.632h-.985l-.135.632a.366.366 0 01-.34.282h-.423a.22.22 0 01-.221-.282l.135-.632h-1.056l-.926 4.359h-2.25L8.87 9.89h2.25l-.359 1.688h4.333a.843.843 0 00.844-.843V9.89a.844.844 0 00-.844-.843H5.813L7.218 7.36h5.494l.135-.633a.366.366 0 01.34-.282h.422a.22.22 0 01.222.282l-.135.633h.985l.134-.633a.366.366 0 01.34-.282h.423a.22.22 0 01.221.282l-.134.633h.834z" }));
}
PASC.DefaultColor = DefaultColor;
export default PASC;
