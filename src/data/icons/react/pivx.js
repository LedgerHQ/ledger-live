//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Pivx({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M6.098 10.35l-.045 5.842-1.7-.013.059-7.53H8.57c2.566 0 4.25-1.358 4.25-3.505V5.02c0-2.135-1.707-3.505-4.25-3.505H3.437v-1.7H8.57c3.41 0 5.95 2.038 5.95 5.205v.125c0 3.176-2.516 5.205-5.95 5.205H6.098zm3.727-6.16v1.7H1.48v-1.7h8.345z"
      />
    </svg>
  );
}
