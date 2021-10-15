import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.072 16.704c2.256 0 3.528-1.872 3.504-4.8-.024-2.856-1.32-4.56-3.504-4.56-1.728 0-3.12 1.32-3.12 3.12 0 1.752 1.272 3.048 2.976 3.048 1.056 0 1.944-.552 2.304-1.416h.144c.072 2.064-.504 3.528-2.328 3.528-1.176 0-1.824-.576-1.968-1.728H8.904c.144 1.704 1.44 2.808 3.168 2.808zM5.76 21.12h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2zm4.368 6.552v-.408c0-1.128.672-1.8 1.92-1.8h.144c1.272 0 1.92.744 1.92 1.8v.408c0 1.128-.672 1.8-1.92 1.8h-.144c-1.248 0-1.92-.672-1.92-1.8z"  /></Svg>;
}

export default NineCircledMediLight;