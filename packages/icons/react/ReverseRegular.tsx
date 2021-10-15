import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ReverseRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.3c5.064 0 9.24-4.176 9.24-9.24S17.064 2.82 12 2.82c-2.88 0-5.376 1.344-7.056 3.528 0-.624.024-1.248.024-1.848V2.7H3.6v6.144h6.144V7.452h-1.8c-.696 0-1.416.024-2.088.072A7.491 7.491 0 0112 4.38c4.224 0 7.68 3.48 7.68 7.68 0 4.2-3.456 7.68-7.68 7.68-4.2 0-7.68-3.48-7.68-7.68H2.76c0 5.064 4.176 9.24 9.24 9.24z"  /></Svg>;
}

export default ReverseRegular;