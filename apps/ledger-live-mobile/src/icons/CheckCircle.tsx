import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number;
  color: string;
} & Partial<React.ComponentProps<typeof Svg>>;

export default function CheckCircle({ size = 37, color, ...props }: Props) {
  return (
    <Svg {...props} viewBox="0 0 37.084 37.084" width={size} height={size}>
      <G transform="translate(-1.458 -1.4491)" fillRule="evenodd">
        <Path
          fill={color}
          d="m34.792 18.467a1.875 1.875 0 0 1 3.75 0v1.533a18.542 18.542 0 1 1-10.996-16.946 1.875 1.875 0 1 1-1.526 3.425 14.792 14.792 0 1 0 8.772 13.521zm0.548-13.125a1.875 1.875 0 0 1 2.653 2.65l-16.667 16.683a1.875 1.875 0 0 1-2.652 0l-5-5a1.875 1.875 0 1 1 2.652-2.65l3.673 3.673z"
        />
      </G>
    </Svg>
  );
}
