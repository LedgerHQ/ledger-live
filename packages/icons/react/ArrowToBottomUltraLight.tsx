import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowToBottomUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 17.22l5.496-5.496-.552-.552-2.232 2.232c-.744.768-1.536 1.56-2.304 2.328V3.3h-.816v12.432l-2.304-2.328-2.232-2.232-.552.552L12 17.22zM3.6 20.7h16.8v-.84H3.6v.84z"  /></Svg>;
}

export default ArrowToBottomUltraLight;