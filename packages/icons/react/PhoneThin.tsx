import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PhoneThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.964 20.916l2.952-3.072-4.824-4.344-4.224 4.152a22.864 22.864 0 01-3-2.52 22.864 22.864 0 01-2.52-3L10.5 7.908 6.156 3.084 3.084 6.036c.744 3.456 2.808 6.768 5.448 9.432 2.688 2.664 5.976 4.728 9.432 5.448zM3.612 6.18l2.496-2.424 3.72 4.152-3.744 3.816c-1.152-1.728-2.016-3.6-2.472-5.544zm8.664 11.736l3.816-3.744 4.152 3.72-2.424 2.496c-1.968-.456-3.816-1.296-5.544-2.472z"  /></Svg>;
}

export default PhoneThin;