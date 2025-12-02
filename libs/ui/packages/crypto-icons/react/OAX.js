import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#164b79";
function OAX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M10.568 14l-.467.998H9.064L11.88 9l1.877 4h-1.061l-.84-1.737-.841 1.766zm4.09.976l2.198-2.963-2.213-2.985h1.211l1.606 2.183-.585.802.585.803-1.605 2.182h-2.222l-.47-.997H14.2zM18.054 12l-.593-.816 1.605-2.182h1.185zm0 0l2.197 2.998h-1.184l-1.605-2.182zM8.567 9.869a2.97 2.97 0 01.814 2.132 3.1 3.1 0 01-.814 2.132c-.542.607-1.211.867-2.001.867a2.68 2.68 0 01-2.001-.867A3 3 0 013.75 12a2.97 2.97 0 01.519-1.736l.69.735a2.12 2.12 0 00.271 2.449 1.8 1.8 0 001.335.607 1.8 1.8 0 001.335-.607 2 2 0 00.542-1.421 2.12 2.12 0 00-.543-1.422 1.75 1.75 0 00-1.335-.578 1.64 1.64 0 00-.936.263l-.69-.735a2.56 2.56 0 011.63-.552 2.63 2.63 0 011.998.865z" }));
}
OAX.DefaultColor = DefaultColor;
export default OAX;
//# sourceMappingURL=OAX.js.map