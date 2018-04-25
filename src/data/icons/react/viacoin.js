//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Viacoin({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M8.239 12.052L13.602.004 15.08.66 8.248 16.004 1.33.664 2.804 0l5.435 12.052zM.5 9.082V7.466h15.21v1.616H.5zm0-3.776V3.69h3.345v1.616H.5zm12.096 0V3.69h3.114v1.616h-3.114z"
      />
    </svg>
  );
}
