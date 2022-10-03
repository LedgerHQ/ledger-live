import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00AEEF";

function KRB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.07 11.03c.178-.031.336-.098.474-.2.138-.1.268-.271.39-.505l2.72-5.24a1.45 1.45 0 01.386-.425.9.9 0 01.526-.16h1.724l-3.386 6.164c-.15.253-.32.46-.51.62-.19.157-.405.28-.638.361.363.094.667.246.915.46.245.21.478.507.695.889l3.259 6.506h-1.898c-.383 0-.691-.206-.924-.615l-2.671-5.513c-.138-.246-.288-.42-.45-.527a1.257 1.257 0 00-.611-.183v2.798H9.579v-2.81H8.482v6.85H6.375v-15h2.107v6.554H9.58V7.812h1.492v3.218h-.001z"  /></Svg>;
}

KRB.DefaultColor = DefaultColor;
export default KRB;