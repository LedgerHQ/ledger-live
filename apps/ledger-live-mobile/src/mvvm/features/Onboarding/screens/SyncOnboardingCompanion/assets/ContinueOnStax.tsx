import React from "react";
import { useTheme } from "styled-components/native";
import { Svg, G, Rect, Path, Defs, ClipPath } from "react-native-svg";

/**
 * This component renders an SVG Stax icon in each step in the Sync Onboarding process.
 */
export default React.memo(function ContinueOnStax() {
  const { theme } = useTheme();
  if (theme === "light") {
    return (
      <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <G clipPath="url(#clip0_15082_6018)">
          <Rect width="48" height="48" rx="24" fill="black" fillOpacity="0.1" />
          <Path
            d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
            fill="black"
            fillOpacity="0.4"
          />
          <Path
            d="M33.5508 14.0217C35.2647 14.0217 36.6542 15.4114 36.6543 17.1252V52.3704H11.6855V14.0217H33.5508Z"
            fill="black"
            fillOpacity="0.05"
            stroke="#767676"
            strokeWidth="1.69275"
          />
        </G>
        <Rect
          width="46.5"
          height="46.5"
          rx="23.25"
          stroke="black"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          transform={[{ translateX: 0.75 }, { translateY: 0.75 }]}
        />
        <Defs>
          <ClipPath id="clip0_15082_6018">
            <Rect width="48" height="48" rx="24" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <G clipPath="url(#clip0_14068_115553)">
        <Rect width="48" height="48" rx="24" fill="white" fillOpacity="0.1" />
        <Path
          d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
          fill="white"
          fillOpacity="0.4"
        />
        <Path
          d="M33.5508 14.0217C35.2647 14.0217 36.6542 15.4114 36.6543 17.1252V52.3704H11.6855V14.0217H33.5508Z"
          fill="white"
          fillOpacity="0.05"
          stroke="#949494"
          strokeWidth="1.69275"
        />
      </G>
      <Rect
        width="46.5"
        height="46.5"
        rx="23.25"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        transform={[{ translateX: 0.75 }, { translateY: 0.75 }]}
      />
      <Defs>
        <ClipPath id="clip0_14068_115553">
          <Rect width="48" height="48" rx="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
});
