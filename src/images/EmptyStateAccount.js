// @flow
import { useTheme } from "@react-navigation/native";
import React from "react";
import Svg, { Path, G, Rect } from "react-native-svg";

export default function EmptystateAccount() {
  const { colors } = useTheme();
  return (
    <Svg viewBox="0 0 400 90">
      <G fill="none" fillRule="evenodd">
        <G
          fill={colors.darkBlue}
          opacity=".30000001"
          transform="translate(5 3)"
        >
          <Path
            fillOpacity=".16"
            stroke={colors.lightFog}
            strokeLinejoin="square"
            d="M15.5 67.5V74c0 1.9329966 1.5670034 3.5 3.5 3.5h350c1.932997 0 3.5-1.5670034 3.5-3.5v-6.5h-357z"
          />
        </G>
        <G
          fill={colors.darkBlue}
          opacity=".60000002"
          transform="translate(5 3)"
        >
          <Path
            fillOpacity=".16"
            stroke={colors.lightFog}
            strokeLinejoin="square"
            d="M7.5 57.5V64c0 1.9329966 1.56700338 3.5 3.5 3.5h365c1.932997 0 3.5-1.5670034 3.5-3.5v-6.5H7.5z"
          />
        </G>
        <G fill={colors.darkBlue} transform="translate(5 3)">
          <Rect
            width="387"
            height="57"
            x=".5"
            y=".5"
            fillOpacity=".16"
            stroke={colors.lightGrey}
            strokeLinejoin="square"
            rx="4"
          />
        </G>
        <Path
          fill={colors.darkBlue}
          d="M88.787234 35c1.1045695 0 2 .8954305 2 2s-.8954305 2-2 2H60c-1.1045695 0-2-.8954305-2-2s.8954305-2 2-2h28.787234zm291.084659 0c1.104569 0 2 .8954305 2 2s-.895431 2-2 2h-27.900574c-1.104569 0-2-.8954305-2-2s.895431-2 2-2h27.900574zM272 30c1.104569 0 2 .8954305 2 2s-.895431 2-2 2h-96c-1.104569 0-2-.8954305-2-2s.895431-2 2-2h96zm-152.56383-5c1.10457 0 2 .8954305 2 2s-.89543 2-2 2H60c-1.1045695 0-2-.8954305-2-2s.8954305-2 2-2h59.43617zm260.435723 0c1.104569 0 2 .8954305 2 2s-.895431 2-2 2h-36.061186c-1.104569 0-2-.8954305-2-2s.895431-2 2-2h36.061186z"
          opacity=".30000001"
        />
        <G fill={colors.success} transform="translate(22 20)">
          <Rect width="24" height="24" opacity=".2" rx="12" />
          <Path
            fillRule="nonzero"
            d="M16.1875 16.3125c.2761424 0 .5.2518398.5.5625s-.2238576.5625-.5.5625h-8c-.27614237 0-.5-.2518398-.5-.5625s.22385763-.5625.5-.5625h8zM12 6.37500001c.3106602 0 .5625.23318502.5625.52083333V13.829l2.0397524-2.0392476c.2196699-.2196699.5758253-.2196699.7954952 0 .2196699.21967.2196699.5758253 0 .7954952l-2.9277752 2.9302126c-.0726474.1020365-.183013.1790139-.3127166.2139133l-.1096927.0186523L12 15.75c-.1964469 0-.3693732-.0932437-.4699724-.2345398l-2.92777516-2.9302126c-.21966992-.2196699-.21966992-.5758252 0-.7954952.21966991-.2196699.57582521-.2196699.79549512 0L11.4375 13.83V6.89583334c0-.28764831.2518398-.52083333.5625-.52083333z"
          />
        </G>
      </G>
    </Svg>
  );
}
