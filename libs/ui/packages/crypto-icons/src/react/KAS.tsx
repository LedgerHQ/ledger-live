import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#70c7ba";
function KAS({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M22.3 7.5c-.6-1.4-1.5-2.6-2.5-3.7-1-1-2.3-1.8-3.7-2.4-1.3-.6-2.8-.8-4.3-.8s-3.1 0-4.4.6C6 1.8 4.9 2.8 3.8 3.9 2.8 4.9 1.6 6 1 7.4.4 8.7.6 10.3.6 11.9s.1 3 .7 4.3c.6 1.4 1.7 2.3 2.8 3.4 1 1 2 2.3 3.3 2.8 1.3.6 2.9.9 4.4.9s3-.5 4.3-1c1.4-.6 2.6-1.5 3.6-2.5s1.9-2.3 2.4-3.7c.6-1.3 1.2-2.8 1.2-4.3s-.5-3-1.1-4.4zM15 18.4l-2.4-.4.7-4.7-5 3.9-1.5-1.9 4.4-3.4-4.4-3.4 1.5-1.9 5 3.9-.7-4.7 2.4-.4 1 6.5z" /></Svg>;
}
KAS.DefaultColor = DefaultColor;
export default KAS;