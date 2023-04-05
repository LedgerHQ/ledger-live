import * as React from "react";
import Svg, { G, Path, Circle, Mask } from "react-native-svg";

const StaxToNano = (
  <Svg width={283} height={144} viewBox="0 0 283 144" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M82 48H68H55V57.5H54V48V47.5C54 46.6716 54.6716 46 55.5 46H82C84.7614 46 87 48.2386 87 51V94C87 96.7614 84.7614 99 82 99H55.5C54.6716 99 54 98.3284 54 97.5V97H82C83.6569 97 85 95.6569 85 94V51C85 49.3431 83.6569 48 82 48Z"
      fill="white"
    />
    <Path d="M54.5 48V97" stroke="white" />
    <Path
      d="M87 54H87.5C87.7761 54 88 54.2239 88 54.5V61.5C88 61.7761 87.7761 62 87.5 62H87V54Z"
      fill="white"
    />
    <Circle opacity={0.2} cx={114} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.4} cx={128} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.6} cx={142} cy={72} r={3} fill="#BBB0FF" />
    <Circle opacity={0.8} cx={156} cy={72} r={3} fill="#BBB0FF" />
    <Circle cx={170} cy={72} r={3} fill="#BBB0FF" />
    <Mask
      id="mask0_3173_52169"
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
        d="M223 32H204V74.5C204 69.2533 208.253 65 213.5 65C218.747 65 223 69.2533 223 74.5V32Z"
        fill="#D9D9D9"
      />
    </Mask>
    <G mask="url(#mask0_3173_52169)">
      <Path
        d="M207 40C207 38.3431 208.343 37 210 37H217C218.657 37 220 38.3431 220 40V105C220 106.105 219.105 107 218 107H209C207.895 107 207 106.105 207 105V40Z"
        stroke="white"
      />
    </G>
    <Path
      d="M208 75.5C208 72.4624 210.462 70 213.5 70V70C216.538 70 219 72.4624 219 75.5V106.275C219 106.675 218.675 107 218.275 107H208.725C208.325 107 208 106.675 208 106.275V75.5Z"
      fill="white"
      stroke="white"
      strokeWidth={3}
    />
    <Circle cx={213.5} cy={75} r={3} fill="white" stroke="black" />
    <Circle cx={213.5} cy={43.75} r={2.75} stroke="white" />
  </Svg>
);

export default StaxToNano;
