import * as React from "react";
import Svg, { SvgProps, Path, Rect, G, Defs, ClipPath } from "react-native-svg";

type Props = SvgProps & { size?: number };

function Stader({ size = 32, ...props }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} fill="none" {...props}>
      <Rect width={size} height={size} fill="#F3F0EB" rx={10} />
      <Rect width={size} height={size} x={0.5} y={0.5} stroke="#fff" strokeOpacity={0.1} rx={9.5} />
      <G clipPath="url(#stader_svg__a)">
        <Path
          fill="#07C166"
          fillRule="evenodd"
          d="M21.333 6.64a.588.588 0 0 1 .487.778l-1.831 5.205a.588.588 0 0 1-1.053.116l-.391-.625-7.068 4.416-.727-1.163A3.967 3.967 0 0 1 12.012 9.9l3.704-2.314-.43-.687a.588.588 0 0 1 .567-.895zm-7.41 12.067A5.34 5.34 0 0 0 11.969 26l7.192-4.152a3.967 3.967 0 0 0 1.452-5.42l-.686-1.188z"
          clipRule="evenodd"
        />
      </G>
      <Defs>
        <ClipPath id="stader_svg__a">
          <Path fill="#fff" d="M6 6h20v20H6z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default Stader;
