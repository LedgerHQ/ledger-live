import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#CFA967";

function HTML({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12.015 12.334v5.994l4.46-1.201 1.048-11.542h-5.508v4.898l.228-.71h.597l-.825 2.56zm-5.538 5.643L5.25 4.5h13.5l-1.227 13.477-5.538 1.523-5.508-1.523zm3.872-5.095v-.556l-1.851-.738 1.852-.742v-.557l-2.645 1.075v.444l2.644 1.074zm5.95-1.074l-2.645 1.074v-.556l1.852-.74-1.852-.74v-.557l2.645 1.075v.444zm-4.284.525v-1.85l-.988 3.08h.591l.397-1.23z"  /></Svg>;
}

HTML.DefaultColor = DefaultColor;
export default HTML;