//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Dascoin({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M2.878 1.612V8.54h-1.7V-.09h2.873v1.7H2.878zm4.274 12.776c1.692.01 3.316-.609 4.512-1.716l1.155 1.247c-1.516 1.404-3.557 2.182-5.672 2.169H1.178v-4.926h1.7v3.226h4.274zm-.46-12.776v-1.7h.455c4.195 0 7.675 2.952 7.675 6.64v2.894a5.719 5.719 0 0 1-.363 2.013l-1.592-.594c.17-.456.256-.934.255-1.417V6.552c0-2.681-2.663-4.94-5.975-4.94h-.455z"
      />
    </svg>
  );
}
