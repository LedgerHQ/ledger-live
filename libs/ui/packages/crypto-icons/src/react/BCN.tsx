import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F04086";

function BCN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.044 12.73c-.472-.522-1.152-.846-2.04-.972v-.019c.778-.126 1.39-.444 1.805-.954.421-.506.65-1.145.646-1.803 0-1.096-.352-1.84-1.083-2.427-.73-.585-1.827-.777-3.313-.777H8.45V11H5.227v2h8.795c.692 0 1.212.049 1.555.326.344.276.52.634.52 1.163s-.174.98-.52 1.264c-.345.282-.865.47-1.555.47h-3.018v-1.556H8.449v3.555h5.795c1.474 0 2.6-.384 3.382-.982.78-.598 1.147-1.48 1.147-2.564a2.858 2.858 0 00-.729-1.946zM13.7 10.995h-2.695V7.773h2.695c1.386 0 2.078.54 2.078 1.61s-.692 1.612-2.078 1.612z"  /></Svg>;
}

BCN.DefaultColor = DefaultColor;
export default BCN;