//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Hcash({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M4.591 2h1.596v12.207H4.591V2zm6.195 0h1.596v12.207h-1.596V2zM5.389 8.901V7.305h6.195v1.596H5.389zm9.468 1.188l.936 1.293-1.777 1.287H2.757L0 8.143l2.753-4.605h11.445L16 6.4l-1.35.85-1.333-2.116H3.658L1.864 8.135l1.79 2.937H13.5l1.358-.983z"
      />
    </svg>
  );
}
