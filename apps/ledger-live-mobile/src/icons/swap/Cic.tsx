import React from "react";
import Svg, { G, Path } from "react-native-svg";

export const Cic = React.memo(({ size }: { size: number }) => (
  <Svg width={size} height={size}>
    <G clipPath="url(#clip0_2553_24519)">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 20.4387V28C8.37632 28 15.1667 21.732 15.1667 14C15.1667 6.26801 8.37632 0 0 0V7.56125C3.86599 7.56125 7 10.444 7 14C7 17.556 3.86599 20.4387 0 20.4387Z"
        fill="#3A57CA"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.1667 8.46154V0C18.7903 0 12 6.26801 12 14C12 21.732 18.7903 28 27.1667 28V19.5385C23.853 19.5385 21.1667 17.0588 21.1667 14C21.1667 10.9412 23.853 8.46154 27.1667 8.46154Z"
        fill="#F57382"
      />
    </G>
  </Svg>
));
