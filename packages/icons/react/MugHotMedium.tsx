import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MugHotMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.944 20.88h2.952c1.608 0 3-.6 3.984-1.896.096-.12.192-.24.264-.36h.96c2.88 0 5.016-1.896 5.016-4.536 0-2.712-2.136-4.608-5.016-4.608H2.88V15c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zM4.92 16.32v-5.04h9v5.04c0 1.968-.744 2.64-2.808 2.64h-3.36c-2.088 0-2.832-.672-2.832-2.64zm1.56-8.4h2.04c0-.96.408-1.296 1.68-1.464l1.752-.216C13.92 6 15.12 4.968 15.024 3.12h-2.04c0 .984-.408 1.32-1.68 1.488l-1.752.216c-1.968.24-3.168 1.272-3.072 3.096zm9.336 8.904c.096-.528.144-1.128.144-1.824v-3.72c2.424 0 3.12.432 3.12 2.232v1.104c0 1.704-.624 2.208-2.832 2.208h-.432z"  /></Svg>;
}

export default MugHotMedium;