import React from "react";

const ExitIcon = ({ color = "#ffffff", size }: { color?: string | undefined; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.833 10H2.49967"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.41699 12.9163L2.50033 9.99967L5.41699 7.08301"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 2.5H15C16.3833 2.5 17.5 3.61667 17.5 5V15C17.5 16.375 16.3833 17.5 15 17.5H10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ExitIcon;
