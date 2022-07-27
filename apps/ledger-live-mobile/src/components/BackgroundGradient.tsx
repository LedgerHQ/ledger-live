import * as React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from "react-native-svg";

function SvgComponent(props) {
  return (
    <Svg
      width={541}
      height={454}
      viewBox="0 0 541 454"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path fill="url(#paint0_linear_5_11)" d="M0 0H541V454H0z" />
      <Path fill="url(#paint1_radial_5_11)" d="M0 0H541V454H0z" />
      <Path fill="url(#paint2_radial_5_11)" d="M0 0H541V454H0z" />
      <Defs>
        <LinearGradient
          id="paint0_linear_5_11"
          x1={270.5}
          y1={0}
          x2={270.5}
          y2={454}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.380208} stopColor="#574772" />
          <Stop offset={0.864583} stopColor="#141315" />
        </LinearGradient>
        <RadialGradient
          id="paint1_radial_5_11"
          cx={0}
          cy={0}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform="rotate(130.005 122.468 209.276) scale(276.113 273.618)"
        >
          <Stop stopColor="#271E48" stopOpacity={0.78} />
          <Stop offset={1} stopColor="#42336B" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="paint2_radial_5_11"
          cx={0}
          cy={0}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(128.49978 203.50003 -238.2652 150.4522 175 236)"
        >
          <Stop stopColor="#B6A1FF" stopOpacity={0.2} />
          <Stop offset={1} stopColor="#9678E3" stopOpacity={0} />
        </RadialGradient>
      </Defs>
    </Svg>
  );
}

export default SvgComponent;
