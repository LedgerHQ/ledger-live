import React from "react";

const ErrorNoBorder = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="64" height="64" rx="32" fill="white" fillOpacity="0.05" />
    <path
      d="M43.104 41.12L33.984 32L43.104 22.88L41.056 20.96L32 30.016L22.944 20.96L20.896 22.88L30.016 32L20.896 41.12L22.944 43.04L32 33.984L41.056 43.04L43.104 41.12Z"
      fill="#E86164"
    />
  </svg>
);
export default ErrorNoBorder;
