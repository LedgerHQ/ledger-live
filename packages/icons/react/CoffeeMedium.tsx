import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoffeeMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.904 15.96h2.952c1.608 0 3-.6 3.984-1.896.096-.12.192-.24.264-.36h.96c2.88 0 5.016-1.896 5.016-4.536 0-2.712-2.136-4.608-5.016-4.608H3.84v5.52c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zM1.92 17.52c0 1.056.864 1.92 1.92 1.92H18a1.91 1.91 0 001.92-1.92h-18zm3.96-6.12V6.36h9v5.04c0 1.968-.744 2.64-2.808 2.64h-3.36c-2.088 0-2.832-.672-2.832-2.64zm10.896.504c.096-.528.144-1.128.144-1.824V6.36c2.424 0 3.12.432 3.12 2.232v1.104c0 1.704-.624 2.208-2.832 2.208h-.432z"  /></Svg>;
}

export default CoffeeMedium;