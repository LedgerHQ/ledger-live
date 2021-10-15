import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.156 16.44h1.368c.312-3.144 1.488-5.688 3.528-7.584V7.584H7.476V8.64h5.184v.336c-2.016 2.112-3.168 4.608-3.504 7.464zm-5.04 4.68h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2z"  /></Svg>;
}

export default SevenCircledFinaLight;