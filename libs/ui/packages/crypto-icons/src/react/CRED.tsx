import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#37E8A3";

function CRED({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.102 11.975l2.611 2.62L18.561 7.7l.939.952-7.787 7.847-3.55-3.572.939-.954zm1.582-.233L14.899 7.5l.94.953-4.213 4.245-.94-.956zm-1.707 3.622l-.927.935-3.55-3.572.938-.952 3.54 3.59z"  /></Svg>;
}

CRED.DefaultColor = DefaultColor;
export default CRED;