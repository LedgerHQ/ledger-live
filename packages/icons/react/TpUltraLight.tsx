import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TpUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.988c4.968 0 9-4.008 9-8.976 0-4.968-4.032-9-9-9s-9 4.032-9 9 4.032 8.976 9 8.976zM5.616 8.82v-.744h6.432v.744H9.216v7.608h-.768V8.82H5.616zm7.536 7.608V8.076h3c1.608 0 2.712 1.056 2.712 2.544 0 1.44-1.104 2.496-2.712 2.496h-2.208v3.312h-.792zm.792-4.056H16.2c1.2 0 1.848-.648 1.848-1.68v-.168c0-1.056-.648-1.704-1.848-1.704h-2.256v3.552z"  /></Svg>;
}

export default TpUltraLight;