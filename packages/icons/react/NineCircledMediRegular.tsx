import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledMediRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.096 16.704c2.328 0 3.6-1.872 3.576-4.8-.024-2.856-1.344-4.56-3.576-4.56-1.728 0-3.192 1.32-3.192 3.144 0 1.728 1.296 3.024 2.952 3.024.888 0 1.68-.384 2.088-1.08h.192c.024 1.848-.552 2.904-2.064 2.904-1.08 0-1.632-.504-1.728-1.488H8.808c.12 1.728 1.488 2.856 3.288 2.856zM5.76 21.24h12.48v-1.56H5.76v1.56zm0-16.92h12.48V2.76H5.76v1.56zm4.68 6.384v-.552c0-.936.528-1.416 1.608-1.416h.192c1.104 0 1.632.504 1.632 1.416v.552c0 .936-.528 1.416-1.632 1.416h-.192c-1.08 0-1.608-.48-1.608-1.416z"  /></Svg>;
}

export default NineCircledMediRegular;