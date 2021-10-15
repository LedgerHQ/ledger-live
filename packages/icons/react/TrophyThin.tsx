import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrophyThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.96 20.4h10.08v-.48h-4.8v-3.96c1.872 0 3.264-.6 4.248-1.896a4.291 4.291 0 00.864-1.752c1.344-.096 2.352-.672 3.12-1.656.624-.792.888-1.8.888-3.288V4.512h-3.792V3.6H6.432v.912H2.64v2.856c0 1.488.264 2.496.888 3.288.768.984 1.776 1.56 3.144 1.656.168.672.456 1.248.864 1.752 1.008 1.296 2.352 1.896 4.224 1.896v3.96h-4.8v.48zM3.12 7.368V4.992h3.312v5.088a9.3 9.3 0 00.144 1.728C4.344 11.64 3.12 9.984 3.12 7.368zm3.792 2.856V4.08h10.176v6.12c0 3.192-1.464 5.256-4.584 5.256h-1.008c-3 0-4.584-2.064-4.584-5.232zm10.536 1.584c.072-.504.12-1.08.12-1.728V4.992h3.312v2.376c0 3.384-1.896 4.32-3.432 4.44z"  /></Svg>;
}

export default TrophyThin;