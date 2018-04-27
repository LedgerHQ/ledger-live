//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Monero({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M8 9.216L16 2v12.365h-1.626V5.657L8 11.406l-6.374-5.75v8.709H0V2z"
      />
    </svg>
  );
}
