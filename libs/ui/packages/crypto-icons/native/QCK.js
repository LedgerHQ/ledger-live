import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#9b9b9b";
function QCK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 19 19", fill: color },
        React.createElement(Path, { d: "M5.777 1.762c-1.46.554-2.195 1.047-3.382 2.297C1.188 5.344.515 6.69.18 8.53c-.278 1.582-.043 3.227.75 4.867.535 1.168 2.078 2.95 2.968 3.465l.594.336-.097-.949c-.079-.89-.04-1.012.671-1.8 1.032-1.13 1.922-1.723 5.145-3.348 1.527-.77 3.187-1.7 3.703-2.098 2.828-2.156 2.078-5.027-1.84-6.887-1.129-.554-1.523-.633-3.265-.672-1.586-.058-2.2.02-3.032.317m11.641 10.094c0 .497-.89 1.227-2.555 2.098-.75.395-1.465.93-1.601 1.207-.633 1.149.691 2.453 2.472 2.453 1.188 0 2.098-.492 2.832-1.582.672-.988.551-2.808-.218-3.84-.614-.793-.93-.91-.93-.336m0 0" }));
}
QCK.DefaultColor = DefaultColor;
export default QCK;
//# sourceMappingURL=QCK.js.map