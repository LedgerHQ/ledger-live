import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HelpLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.184 13.392h.912c2.304 0 3.576-1.584 3.576-3.48S14.4 6.336 12.144 6.336c-2.112 0-3.552 1.584-3.552 3.36v.096h1.2v-.24c0-1.344.744-2.064 2.256-2.064h.168c1.536 0 2.256.744 2.256 2.136v.672c0 1.344-.72 2.016-2.16 2.016h-1.128v1.08zM2.88 12c0 5.088 4.032 9.12 9.12 9.12 5.112 0 9.12-4.152 9.12-9.12 0-5.088-4.032-9.12-9.12-9.12-5.088 0-9.12 4.032-9.12 9.12zm1.2 0c0-4.44 3.48-7.92 7.92-7.92 4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92-4.44 0-7.92-3.48-7.92-7.92zm6.984 5.04h1.872v-1.872h-1.872v1.872z"  /></Svg>;
}

export default HelpLight;