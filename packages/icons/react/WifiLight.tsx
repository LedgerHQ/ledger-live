import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.956 8.496l.864.912c2.376-2.28 5.448-3.696 9.168-3.696 3.72 0 6.792 1.416 9.168 3.696l.888-.912C19.5 6.072 15.996 4.44 11.988 4.44c-4.008 0-7.512 1.632-10.032 4.056zm3.12 3.408l.84.936c1.68-1.464 3.648-2.28 6.072-2.28s4.392.84 6.072 2.28l.84-.936c-1.848-1.584-4.224-2.616-6.912-2.616-2.688 0-5.064 1.008-6.912 2.616zm3.192 3.528l3.72 4.128 3.744-4.128a5.727 5.727 0 00-3.744-1.368c-1.44 0-2.712.528-3.72 1.368z"  /></Svg>;
}

export default WifiLight;