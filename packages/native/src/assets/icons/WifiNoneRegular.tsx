import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiNoneRegular({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.464 21.312l1.032-1.032L7.536 7.32 6.312 6.072 2.904 2.688 1.872 3.72l3.024 3.024c-1.128.648-2.184 1.392-3.072 2.28L2.976 10.2a13.095 13.095 0 013.12-2.256l2.52 2.52c-1.32.432-2.52 1.152-3.576 2.04l1.104 1.248c1.128-.984 2.352-1.656 3.792-1.968l3.192 3.192A5.547 5.547 0 008.352 16.2L12 20.232l3.024-3.36 4.44 4.44zM8.544 5.352L9.912 6.72A14.753 14.753 0 0112 6.576c3.672 0 6.696 1.368 9.048 3.624l1.128-1.176A14.713 14.713 0 0012 4.92c-1.2 0-2.352.144-3.456.432zm4.608 4.608l2.352 2.376a7.526 7.526 0 012.376 1.416l1.08-1.248a10.603 10.603 0 00-5.808-2.544z"
        fill={color}
      />
    </Svg>
  );
}

export default WifiNoneRegular;
