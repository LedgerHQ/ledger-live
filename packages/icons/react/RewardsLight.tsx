import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RewardsLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.256 18.024h13.512v-1.08h-2.064a7.73 7.73 0 003.336-6.384c0-4.416-3.624-8.04-8.04-8.04-4.416 0-8.04 3.624-8.04 8.04 0 2.616 1.248 4.944 3.336 6.384h-2.04v1.08zM2.16 21.48h19.68v-6.6h-1.2v5.448H3.36V14.88h-1.2v6.6zm3-10.92A6.837 6.837 0 0112 3.72a6.822 6.822 0 016.84 6.84 6.616 6.616 0 01-4.776 6.384H9.936A6.645 6.645 0 015.16 10.56z"  /></Svg>;
}

export default RewardsLight;