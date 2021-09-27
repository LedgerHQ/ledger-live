import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function PhoneUltraLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.988 21.156l3.168-3.264-5.112-4.608-4.224 4.176a22.773 22.773 0 01-2.856-2.424 20.733 20.733 0 01-2.4-2.856l4.152-4.224-4.608-5.112-3.264 3.168c.744 3.528 2.856 6.912 5.52 9.624 2.736 2.688 6.096 4.8 9.624 5.52zM3.78 6.276l2.304-2.208 3.48 3.864-3.48 3.552C5.028 9.852 4.212 8.1 3.78 6.276zm8.736 11.664l3.552-3.48 3.864 3.456-2.208 2.304c-1.824-.432-3.576-1.224-5.208-2.28z"
        fill={color}
      />
    </Svg>
  );
}

export default PhoneUltraLight;
