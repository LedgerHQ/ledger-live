import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UndelegateRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.352 9.624l12.264 12.264 1.056-1.056-18.72-18.72-1.056 1.056L7.248 8.52A5.74 5.74 0 006.072 12v8.4h1.56V12c0-.912.24-1.704.72-2.376zm2.016-3.144l1.296 1.32h7.848a81.67 81.67 0 00-1.464 1.368L16.8 10.44l.96.984 4.344-4.368-4.344-4.344-.96.984 1.248 1.248c.456.456.936.912 1.416 1.368h-7.68c-.504 0-.984.048-1.416.168z"  /></Svg>;
}

export default UndelegateRegular;