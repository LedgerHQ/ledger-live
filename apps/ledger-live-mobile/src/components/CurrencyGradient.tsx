import * as React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Mask,
  G,
} from "react-native-svg";
import { useTheme } from "styled-components/native";
import { ensureContrast } from "../colors";

function CurrencyGradient({ gradientColor }: { gradientColor: string }) {
  const { colors } = useTheme();
  const contrastedColor = ensureContrast(gradientColor, colors.background.main);
  return (
    <Svg width={541} height={454} viewBox="0 0 541 454" fill="none">
      <Mask
        id="a"
        // @ts-expect-error maskType is not in the type definition
        style={{
          maskType: "alpha",
        }}
        maskUnits={"userSpaceOnUse" as const}
        x={0}
        y={0}
        width={541}
        height={454}
      >
        <Path fill="#fff" d="M0 0H541V454H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path fill={colors.background.main} d="M0 0H541V454H0z" />
        <Path
          fill="url(#paint0_linear_22_3)"
          fillOpacity={0.3}
          d="M0 0H541V450.077H0z"
        />
        <Path fill="url(#paint1_linear_22_3)" d="M0 0H541V450.077H0z" />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_22_3"
          x1={270.5}
          y1={0}
          x2={270.5}
          y2={450.077}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={contrastedColor} />
          <Stop offset={1} stopColor={contrastedColor} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_22_3"
          x1={270.5}
          y1={0}
          x2={270.5}
          y2={450.077}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={colors.background.main} stopOpacity={0} />
          <Stop offset={1} stopColor={colors.background.main} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

export default CurrencyGradient;
