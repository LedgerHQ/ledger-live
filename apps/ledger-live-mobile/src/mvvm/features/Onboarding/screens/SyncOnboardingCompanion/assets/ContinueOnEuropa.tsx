import React from "react";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { useTheme } from "styled-components/native";

/**
 * This component renders an SVG Europa icon in each step in the Sync Onboarding process.
 */
export default React.memo(function ContinueOnEuropa() {
  const { theme } = useTheme();
  if (theme === "light") {
    return (
      <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <G clipPath="url(#clip0_15082_6009)">
          <Rect width="48" height="48" rx="24" fill="black" fillOpacity="0.1" />
          <Path
            d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
            fill="black"
            fillOpacity="0.4"
          />
          <Path
            d="M32.8086 14.0217C34.9327 14.0219 36.6543 15.7442 36.6543 17.8684V52.3704H11.6855V17.8684C11.6855 15.7441 13.4079 14.0217 15.5322 14.0217H32.8086Z"
            fill="black"
            fillOpacity="0.05"
            stroke="#767676"
            strokeWidth="1.69275"
          />
          <Path
            d="M14.0303 43.1301C14.0303 41.882 15.0421 40.8701 16.2903 40.8701H32.0533C33.2998 40.8701 34.3103 41.8806 34.3103 43.1271V53.5301H14.0303V43.1301Z"
            fill="black"
            fillOpacity="0.4"
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
          <ClipPath id="clip0_15082_6009">
            <Rect width="48" height="48" rx="24" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <G clipPath="url(#clip0_15009_5922)">
        <Rect width="48" height="48" rx="24" fill="white" fillOpacity="0.1" />
        <Path
          d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
          fill="white"
          fillOpacity="0.4"
        />
        <Path
          d="M32.8086 14.0217C34.9327 14.0219 36.6543 15.7442 36.6543 17.8684V52.3704H11.6855V17.8684C11.6855 15.7441 13.4079 14.0217 15.5322 14.0217H32.8086Z"
          fill="white"
          fillOpacity="0.05"
          stroke="#949494"
          strokeWidth="1.69275"
        />
        <Path
          d="M14.0303 43.1301C14.0303 41.882 15.0421 40.8701 16.2903 40.8701H32.0533C33.2998 40.8701 34.3103 41.8806 34.3103 43.1271V53.5301H14.0303V43.1301Z"
          fill="white"
          fillOpacity="0.4"
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
        <ClipPath id="clip0_15009_5922">
          <Rect width="48" height="48" rx="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
});
