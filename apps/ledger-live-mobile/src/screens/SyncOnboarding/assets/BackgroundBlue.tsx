import React from "react";
import Svg, { Defs, Rect, Mask, Pattern, Circle, RadialGradient, Stop } from "react-native-svg";

const BackgroundBlue = () => {
  return (
    <Svg height={200} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        {/* 1. tiny 2×2px grey dot pattern */}
        <Pattern id="dots" patternUnits="userSpaceOnUse" width={"6px"} height={"6px"}>
          <Circle cx="0" cy="0" r="1" fill="lightgrey" />
        </Pattern>

        {/* 2. radial gradient for mask */}
        <RadialGradient id="maskGrad1" cx="40%" cy="0%" r="80%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="1" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="maskGrad2" cx="50%" cy="10%" r="100%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="1" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="maskGrad3" cx="70%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="1" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="maskGradDots" cx="50%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="white" stopOpacity="0.4" />
          <Stop offset="1" stopColor="black" stopOpacity="0" />
        </RadialGradient>

        {/* 3. mask using that gradient */}
        <Mask id="fadeMask1" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGrad1)" />
        </Mask>

        <Mask id="fadeMask2" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGrad2)" />
        </Mask>

        <Mask id="fadeMask3" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGrad3)" />
        </Mask>

        <Mask id="fadeMaskDots" width="100%" height="100%">
          <Rect width="100%" height="100%" fill="url(#maskGradDots)" />
        </Mask>
      </Defs>

      {/* 4a. purple base */}
      <Rect width="100%" height="100%" fill="#60449D" mask="url(#fadeMask1)" opacity={0.3} />

      <Rect width="100%" height="100%" fill="#91A3FF" mask="url(#fadeMask2)" opacity={0.2} />

      <Rect width="100%" height="100%" fill="#544598" mask="url(#fadeMask3)" opacity={0.3} />

      {/* 4b. grey-dot mosaic on top, same mask */}
      <Rect width="100%" height="100%" fill="url(#dots)" mask="url(#fadeMaskDots)" opacity={0.3} />
    </Svg>
  );
};

export default BackgroundBlue;
