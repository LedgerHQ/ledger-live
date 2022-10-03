import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#103F68";

function MCO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.985 3.757l7.14 4.112v8.25l-7.132 4.124-.058-.014-7.06-4.11v-8.25l7.06-4.112h.05zm-.023.853L5.625 8.3v7.388l6.336 3.689.774-.448 5.64-3.243V8.301l-5.64-3.263-.773-.429zm-5.355 7.958l1.875-1.403 1.659 1.06v1.904l1.255 1.21-.001.566-1.21 1.133h-1.02l-2.557-4.47h-.001zm5.927 3.339l-.002-.57 1.25-1.208v-1.905l1.64-1.072 1.872 1.417-2.545 4.456h-1.008l-1.207-1.118zm-1.777-3.683l-.611-1.598h3.628l-.598 1.598.177 1.787-1.4.003-1.384.002.188-1.792zm1.196-2.036l-3.449-.002.642-2.864h5.597l.675 2.868-3.465-.002z"  /></Svg>;
}

MCO.DefaultColor = DefaultColor;
export default MCO;