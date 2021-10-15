import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HistoryRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.3c5.064 0 9.24-4.176 9.24-9.24S17.064 2.82 12 2.82c-2.88 0-5.4 1.344-7.08 3.528.024-.6.048-1.224.048-1.824V2.7H3.6v6.144h5.496V7.452H7.848c-.648 0-1.344.024-2.016.072C7.224 5.628 9.432 4.38 12 4.38c4.224 0 7.68 3.48 7.68 7.68 0 4.2-3.456 7.68-7.68 7.68-4.2 0-7.68-3.48-7.68-7.68H2.76c0 5.064 4.176 9.24 9.24 9.24zm-.744-9.24a.76.76 0 00.216.552l3.456 3.456 1.104-1.104-3.216-3.216V6.54h-1.56v5.52z"  /></Svg>;
}

export default HistoryRegular;