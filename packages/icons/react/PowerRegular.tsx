import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PowerRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.224 22.344l9.72-12.864h-6.48l.288-7.824L4.056 14.52h6.456l-.288 7.824zm-3.312-9.216l5.304-7.104L12 10.848h5.088l-5.328 7.128.24-4.848H6.912z"  /></Svg>;
}

export default PowerRegular;