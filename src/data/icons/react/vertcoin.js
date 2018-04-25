//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Vertcoin({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M14.606.5L16 1.346 7.405 15.51 2.088 7.935l-.885.966L0 7.8l2.256-2.462 5.05 7.192z"
      />
    </svg>
  );
}
