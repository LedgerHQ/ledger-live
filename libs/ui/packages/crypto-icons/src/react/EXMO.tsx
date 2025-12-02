import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#347ffb";
function EXMO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M14.796 9.416l-2.152 5.813-.013.035-.395-.791-.825.375L13.575 9l.825-.375zm5.385.137l-2.151 5.822-.395-.793-.825.374.05-.136L19.01 9l.825-.375.394.791zm-4.605 5.034l1.267-3.422-.828.375-.393-.792-1.27 3.421.394.793zm-6.853-3.374H4.94l.646.6-.646.61h3.78l.643-.61zM4.416 13.75h6.116l-.643.605.643.604H4.416l-.645-.604zm1.876-5.076h6.112l-.64.606.641.604H6.293l-.646-.605z" clipRule="evenodd" /></Svg>;
}
EXMO.DefaultColor = DefaultColor;
export default EXMO;