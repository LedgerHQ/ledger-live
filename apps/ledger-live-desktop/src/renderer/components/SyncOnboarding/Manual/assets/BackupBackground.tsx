import React from "react";

export default function BackupBackground() {
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
        <radialGradient id="maskGradPink" cx="60%" cy="10%" r="80%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.6" />
          <stop offset="0.2" stopColor="white" stopOpacity="0.6" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maskGradOrange" cx="65%" cy="0%" r="80%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.6" />
          <stop offset="0.2" stopColor="white" stopOpacity="0.6" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="maskGradPurple"
          cx="50%"
          cy="0%"
          r="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="white" stopOpacity="0.4" />
          <stop offset="0.2" stopColor="white" stopOpacity="0.4" />
          <stop offset="0.6" stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="maskGradDots" cx="50%" cy="0%" r="90%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.4" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </radialGradient>
        {/* 3. mask using that gradient */}
        <mask id="fadeMaskPink" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradPink)" />
        </mask>
        {/* 4. mask using that gradient */}
        <mask id="fadeMaskOrange" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradOrange)" />
        </mask>
        {/* 5. mask using that gradient */}
        <mask id="fadeMaskDots" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradDots)" />
        </mask>
      </defs>
      <mask id="fadeMaskPurple" x="0" y="0" width="100%" height="100%">
        <rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradPurple)" />
      </mask>
      {/* 4a. purple base */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#B84DB2"
        mask="url(#fadeMaskPink)"
        opacity={0.4}
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#FF7715"
        mask="url(#fadeMaskOrange)"
        opacity={0.3}
      />
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="#544598"
        mask="url(#fadeMaskPurple)"
        opacity={0.2}
      />
      {/* 4b. grey-dot mosaic on top, same mask */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#dots)"
        mask="url(#fadeMaskDots)"
        opacity={0.4}
      />
    </svg>
  );
}
