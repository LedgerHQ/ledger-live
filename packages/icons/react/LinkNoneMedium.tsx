import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkNoneMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.728 21.072l1.344-1.344-16.8-16.8-1.344 1.344 16.8 16.8zm-15.984-.816c1.944 1.968 5.136 1.968 7.104 0l2.664-2.664-1.44-1.44-2.688 2.664c-1.584 1.584-2.616 1.584-4.2 0s-1.584-2.616 0-4.2l2.664-2.688-1.44-1.44-2.664 2.688a4.983 4.983 0 000 7.08zm6.744-13.848l1.44 1.44 2.688-2.664c1.584-1.584 2.616-1.584 4.2 0s1.584 2.616 0 4.2l-2.664 2.688 1.44 1.44 2.664-2.664c1.968-1.968 1.968-5.16 0-7.104a4.983 4.983 0 00-7.08 0l-2.688 2.664z"  /></Svg>;
}

export default LinkNoneMedium;