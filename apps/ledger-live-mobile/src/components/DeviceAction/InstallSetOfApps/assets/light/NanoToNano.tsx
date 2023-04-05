import * as React from "react";
import Svg, { G, Path, Circle, Mask } from "react-native-svg";

const NanoToNano = (
  <Svg width={283} height={144} viewBox="0 0 283 144" fill="none">
    <Mask
      id="a"
      style={{
        maskType: "alpha",
      }}
      maskUnits="userSpaceOnUse"
      x={62}
      y={32}
      width={19}
      height={43}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M81 32H62v42.5a9.5 9.5 0 0119 0V32z"
        fill="#D9D9D9"
      />
    </Mask>
    <G mask="url(#a)">
      <Path
        d="M65 40a3 3 0 013-3h7a3 3 0 013 3v65a2 2 0 01-2 2h-9a2 2 0 01-2-2V40z"
        stroke="#fff"
      />
    </G>
    <Path
      d="M66 75.5a5.5 5.5 0 015.5-5.5v0a5.5 5.5 0 015.5 5.5v30.775c0 .4-.325.725-.725.725h-9.55a.725.725 0 01-.725-.725V75.5z"
      fill="#fff"
      stroke="#fff"
      strokeWidth={3}
    />
    <Circle cx={71.5} cy={75} r={3} fill="#fff" stroke="#000" />
    <Circle cx={71.5} cy={43.75} r={2.75} stroke="#fff" />
    <Circle opacity={0.2} cx={114} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.4} cx={128} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.6} cx={142} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.8} cx={156} cy={72} r={3} fill="#BBB0FF" />
    <Circle cx={170} cy={72} r={3} fill="#BBB0FF" />
    <Mask
      id="b"
      style={{
        maskType: "alpha",
      }}
      maskUnits="userSpaceOnUse"
      x={204}
      y={32}
      width={19}
      height={43}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M223 32h-19v42.5a9.5 9.5 0 019.5-9.5 9.5 9.5 0 019.5 9.5V32z"
        fill="#D9D9D9"
      />
    </Mask>
    <G mask="url(#b)">
      <Path
        d="M207 40a3 3 0 013-3h7a3 3 0 013 3v65a2 2 0 01-2 2h-9a2 2 0 01-2-2V40z"
        stroke="#fff"
      />
    </G>
    <Path
      d="M208 75.5a5.5 5.5 0 015.5-5.5v0a5.5 5.5 0 015.5 5.5v30.775c0 .4-.325.725-.725.725h-9.55a.726.726 0 01-.725-.725V75.5z"
      fill="#fff"
      stroke="#fff"
      strokeWidth={3}
    />
    <Circle cx={213.5} cy={75} r={3} fill="#fff" stroke="#000" />
    <Circle cx={213.5} cy={43.75} r={2.75} stroke="#fff" />
  </Svg>
);

export default NanoToNano;
