import React from "react";
import Svg, { Defs, Rect, Mask, Pattern, Circle, RadialGradient, Stop } from "react-native-svg";

const BackgroundRed = () => {
  return (
    <Svg height={200} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        {/* 1. tiny 2×2px grey dot pattern */}
        <Pattern id="dots" patternUnits="userSpaceOnUse" width={"6px"} height={"6px"}>
          <Circle cx="0" cy="0" r="1" fill="lightgrey" />
        </Pattern>

        {/* 2. radial gradient for mask */}
        <RadialGradient id="maskGradPink" cx="60%" cy="10%" r="80%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.6" />
          <Stop offset="0.2" stopColor="white" stopOpacity="0.6" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="maskGradOrange" cx="65%" cy="0%" r="80%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.6" />
          <Stop offset="0.2" stopColor="white" stopOpacity="0.6" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient
          id="maskGradPurple"
          cx="50%"
          cy="0%"
          r="100%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="white" stopOpacity="0.4" />
          <Stop offset="0.2" stopColor="white" stopOpacity="0.4" />
          <Stop offset="0.6" stopColor="white" stopOpacity="0.3" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="maskGradDots" cx="50%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.4" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        {/* 3. mask using that gradient */}
        <Mask id="fadeMaskPink" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGradPink)" />
        </Mask>

        {/* 4. mask using that gradient */}
        <Mask id="fadeMaskOrange" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGradOrange)" />
        </Mask>

        {/* 5. mask using that gradient */}
        <Mask id="fadeMaskDots" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGradDots)" />
        </Mask>
      </Defs>

      <Mask id="fadeMaskPurple" width="100%" height="100%">
        <Rect width="100%" height="100%" fill="url(#maskGradPurple)" />
      </Mask>

      {/* 4a. purple base */}
      <Rect width="100%" height="100%" fill="#B84DB2" mask="url(#fadeMaskPink)" opacity={0.4} />

      <Rect width="100%" height="100%" fill="#FF7715" mask="url(#fadeMaskOrange)" opacity={0.3} />

      <Rect width="100%" height="100%" fill="#544598" mask="url(#fadeMaskPurple)" opacity={0.2} />

      {/* 4b. grey-dot mosaic on top, same mask */}
      <Rect width="100%" height="100%" fill="url(#dots)" mask="url(#fadeMaskDots)" opacity={0.4} />
    </Svg>
  );
};

export default BackgroundRed;
