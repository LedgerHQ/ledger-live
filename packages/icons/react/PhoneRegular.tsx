import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PhoneRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.072 21.6l3.528-3.672-5.616-5.064-4.272 4.176a24.258 24.258 0 01-2.568-2.184 24.258 24.258 0 01-2.184-2.568l4.176-4.272L6.072 2.4 2.4 5.952c.72 3.648 2.904 7.2 5.664 9.984 2.808 2.784 6.312 4.968 10.008 5.664zM4.104 6.456L6 4.632l3 3.36-2.928 2.976c-.888-1.44-1.56-2.952-1.968-4.512zm8.928 11.472L16.008 15l3.36 3-1.824 1.896a16.021 16.021 0 01-4.512-1.968z"  /></Svg>;
}

export default PhoneRegular;