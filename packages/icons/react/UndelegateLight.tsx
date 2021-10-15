import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UndelegateLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.268 9.36l12.408 12.408.816-.816-18.72-18.72-.816.816 5.472 5.448C6.66 9.48 6.18 10.68 6.18 12v8.4h1.2V12c0-1.032.312-1.92.888-2.64zm2.16-2.736l1.032 1.008H20.004a97.129 97.129 0 00-1.584 1.536l-1.464 1.488.744.744 4.344-4.344L17.7 2.712l-.744.768 1.464 1.464a94.88 94.88 0 001.56 1.536h-8.256c-.456 0-.888.048-1.296.144z"  /></Svg>;
}

export default UndelegateLight;