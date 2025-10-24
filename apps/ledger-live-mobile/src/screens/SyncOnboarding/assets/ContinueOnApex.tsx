import React from "react";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { useTheme } from "styled-components/native";

/**
 * This component renders an SVG Apex icon in each step in the Sync Onboarding process.
 */
export default React.memo(function ContinueOnApex() {
  const { theme } = useTheme();
  if (theme === "light") {
    return (
      <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <G clipPath="url(#clip0_15951_5991)">
          <Rect width="48" height="48" rx="24" fill="black" fillOpacity="0.1" />
          <Path
            d="M35.251 17.7854H36.912C37.1539 17.7854 37.3499 17.9814 37.3499 18.2232V23.4638C37.3499 23.7056 37.1539 23.9017 36.912 23.9017H35.251V17.7854Z"
            fill="black"
            fillOpacity="0.4"
          />
          <Path
            d="M33 48.1533C35.1243 48.1533 36.8467 49.8757 36.8467 52V57.8467H12.1533V52C12.1533 49.8757 13.8757 48.1533 16 48.1533H33Z"
            fill="black"
            fillOpacity="0.05"
            stroke="#767676"
            strokeWidth="1.69275"
          />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M33 12C34.6569 12 36 13.3431 36 15V45C36 46.6569 34.6569 48 33 48H15C13.3431 48 12 46.6569 12 45V15C12 13.3431 13.3431 12 15 12H33ZM29.5 43C28.6716 43 28 43.6716 28 44.5C28 45.3284 28.6716 46 29.5 46H32.5C33.3284 46 34 45.3284 34 44.5C34 43.6716 33.3284 43 32.5 43H29.5ZM15 14C14.4477 14 14 14.4477 14 15V38C14 38.5523 14.4477 39 15 39H33C33.5523 39 34 38.5523 34 38V15C34 14.4477 33.5523 14 33 14H15Z"
            fill="#767676"
          />
        </G>
        <Rect
          x="0.75"
          y="0.75"
          width="46.5"
          height="46.5"
          rx="23.25"
          stroke="black"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        <Defs>
          <ClipPath id="clip0_15951_5991">
            <Rect width="48" height="48" rx="24" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <G clipPath="url(#clip0_15951_5990)">
        <Rect width="48" height="48" rx="24" fill="white" fillOpacity="0.1" />
        <Path
          d="M35.251 17.7854H36.912C37.1539 17.7854 37.3499 17.9814 37.3499 18.2232V23.4638C37.3499 23.7056 37.1539 23.9017 36.912 23.9017H35.251V17.7854Z"
          fill="white"
          fillOpacity="0.4"
        />
        <Path
          d="M33 48.1533C35.1243 48.1533 36.8467 49.8757 36.8467 52V57.8467H12.1533V52C12.1533 49.8757 13.8757 48.1533 16 48.1533H33Z"
          fill="white"
          fillOpacity="0.05"
          stroke="#949494"
          strokeWidth="1.69275"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M33 12C34.6569 12 36 13.3431 36 15V45C36 46.6569 34.6569 48 33 48H15C13.3431 48 12 46.6569 12 45V15C12 13.3431 13.3431 12 15 12H33ZM29.5 43C28.6716 43 28 43.6716 28 44.5C28 45.3284 28.6716 46 29.5 46H32.5C33.3284 46 34 45.3284 34 44.5C34 43.6716 33.3284 43 32.5 43H29.5ZM15 14C14.4477 14 14 14.4477 14 15V38C14 38.5523 14.4477 39 15 39H33C33.5523 39 34 38.5523 34 38V15C34 14.4477 33.5523 14 33 14H15Z"
          fill="#949494"
        />
      </G>
      <Rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="23.25"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      <Defs>
        <ClipPath id="clip0_15951_5990">
          <Rect width="48" height="48" rx="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
});
