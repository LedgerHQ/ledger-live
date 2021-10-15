import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ComputerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.184 20.4h13.632a1.883 1.883 0 00-1.896-1.68h-1.944l-.504-2.4h5.088c.984 0 1.8-.816 1.8-1.8V5.4c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.088l-.504 2.4H7.08c-.96 0-1.776.744-1.896 1.68zm-.624-5.928V5.448c0-.024.024-.048.048-.048h14.784c.024 0 .048.024.048.048v9.024a.052.052 0 01-.048.048H4.608a.052.052 0 01-.048-.048zm6.072 4.248l.504-2.4h1.728l.504 2.4h-2.736z"  /></Svg>;
}

export default ComputerMedium;