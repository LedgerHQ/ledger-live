import React from "react";

export default function SetupBackground() {
  return (
    <svg
      height={280}
      width={"100%"}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <defs>
        {/* 1. tiny 2×2px grey dot pattern */}
        <pattern id="dots" patternUnits="userSpaceOnUse" width={"6px"} height={"6px"}>
          <circle cx="0" cy="0" r="1" fill="lightgrey" />
        </pattern>
        {/* 2. radial gradient for mask */}
        <radialGradient id="maskGrad1" cx="40%" cy="0%" r="80%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maskGrad2" cx="50%" cy="10%" r="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maskGrad3" cx="70%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maskGradDots" cx="50%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.4" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        {/* 3. mask using that gradient */}
        <mask id="fadeMask1" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGrad1)" />
        </mask>
        <mask id="fadeMask2" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGrad2)" />
        </mask>
        <mask id="fadeMask3" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGrad3)" />
        </mask>
        <mask id="fadeMaskDots" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradDots)" />
        </mask>
      </defs>
      {/* 4a. purple base */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#60449D"
        mask="url(#fadeMask1)"
        opacity={0.3}
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#91A3FF"
        mask="url(#fadeMask2)"
        opacity={0.2}
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#544598"
        mask="url(#fadeMask3)"
        opacity={0.3}
      />
      {/* 4b. grey-dot mosaic on top, same mask */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#dots)"
        mask="url(#fadeMaskDots)"
        opacity={0.3}
      />
    </svg>
  );
}
