import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoXMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 22.32l4.848-4.848L6.504 1.68 1.68 6.528 17.472 22.32zM4.056 6.528l2.448-2.472 6.024 6a3.63 3.63 0 00-1.608.912c-.432.432-.72.984-.864 1.56l-6-6zm1.608.048c0 .48.408.888.888.888.48 0 .912-.408.912-.888a.927.927 0 00-.912-.912c-.48 0-.888.408-.888.912zm6.384 7.968c-.624-.648-.576-1.728.072-2.4.696-.672 1.776-.672 2.4-.072l5.424 5.4-2.472 2.472-5.424-5.4zm.552-1.032c0 .48.408.888.888.888.48 0 .912-.408.912-.888a.927.927 0 00-.912-.912c-.48 0-.888.408-.888.912z"  /></Svg>;
}

export default NanoXMedium;