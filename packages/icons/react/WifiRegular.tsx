import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.824 8.448l1.128 1.176C5.304 7.368 8.328 6 12 6c3.672 0 6.696 1.368 9.048 3.624l1.128-1.176A14.713 14.713 0 0012 4.344 14.713 14.713 0 001.824 8.448zm3.216 3.48l1.08 1.248c1.656-1.416 3.504-2.208 5.88-2.208s4.224.792 5.88 2.208l1.08-1.248c-1.848-1.584-4.248-2.616-6.96-2.616-2.712 0-5.112 1.032-6.96 2.616zm3.312 3.696L12 19.656l3.672-4.032A5.564 5.564 0 0012 14.28a5.547 5.547 0 00-3.648 1.344z"  /></Svg>;
}

export default WifiRegular;