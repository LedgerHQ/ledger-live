//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Ripple({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M13.656 1.375h2.314L11.156 6.14a4.496 4.496 0 0 1-6.312 0L.03 1.375h2.314L6 4.995a2.847 2.847 0 0 0 3.997 0zM2.314 14.625H0l4.844-4.794a4.496 4.496 0 0 1 6.311 0L16 14.625h-2.314l-3.688-3.65a2.847 2.847 0 0 0-3.997 0z"
      />
    </svg>
  );
}
