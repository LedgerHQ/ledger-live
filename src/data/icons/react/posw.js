//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Posw({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M3.28 5.08L4.482 4l5.474 6.096-1.202 1.08L3.28 5.08zm4.388 0L8.87 4l5.479 6.096-1.202 1.08L7.668 5.08zm4.393 0L13.263 4 16 7.048l-1.202 1.08L12.06 5.08zM2.737 7.048l1.202 1.08-2.737 3.048L0 10.096l2.737-3.048zm2.085 2.177l1.202 1.08-.782.87-1.202-1.079.782-.87z"
      />
    </svg>
  );
}
