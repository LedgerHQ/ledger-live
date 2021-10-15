import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TpThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.868c4.896 0 8.88-3.96 8.88-8.856s-3.984-8.88-8.88-8.88c-4.896 0-8.88 3.984-8.88 8.88 0 4.896 3.984 8.856 8.88 8.856zM5.64 8.556v-.48h6.432v.48H9.096v7.872h-.48V8.556H5.64zm7.608 7.872V8.076h2.976c1.56 0 2.64 1.032 2.64 2.472 0 1.416-1.08 2.448-2.64 2.448h-2.496v3.432h-.48zm.48-3.912h2.496c1.368 0 2.16-.768 2.16-1.944v-.048c0-1.2-.792-1.968-2.16-1.968h-2.496v3.96z"  /></Svg>;
}

export default TpThin;