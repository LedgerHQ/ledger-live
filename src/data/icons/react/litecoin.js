//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Litecoin({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M4.535 14.348h9.198V16H2L9.064 0l1.511.667-6.04 13.681zM2.738 9.156l-.15-1.645 9.05-.827.15 1.645-9.05.827z"
      />
    </svg>
  );
}
