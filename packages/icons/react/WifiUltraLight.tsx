import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.088 8.532l.624.624C5.088 6.852 8.232 5.412 12 5.412c3.768 0 6.912 1.44 9.312 3.744l.6-.624A14.164 14.164 0 0012 4.548c-3.96 0-7.392 1.56-9.912 3.984zm3.048 3.312l.576.648C7.44 11.004 9.504 10.14 12 10.14c2.496 0 4.56.864 6.288 2.352l.576-.648c-1.848-1.584-4.2-2.568-6.864-2.568-2.664 0-5.016.984-6.864 2.568zm3.048 3.408l.576.624A5.002 5.002 0 0112 14.7c1.272 0 2.352.456 3.24 1.176l.552-.648A5.876 5.876 0 0012 13.836a5.88 5.88 0 00-3.816 1.416zm2.568 2.832L12 19.452l1.248-1.368c-.312-.288-.744-.456-1.248-.456s-.936.168-1.248.456z"  /></Svg>;
}

export default WifiUltraLight;