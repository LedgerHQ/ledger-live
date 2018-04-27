//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Ubiq({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M7.302 2.542L1.577 5.378v4.456l2.477 1.626V7.536l3.248-1.715V2.54zM5.631 8.487v5.895L0 10.686V4.399L8.88 0v6.771L5.63 8.487zm8.357 2.141V6.166l-2.476-1.625v3.923l-3.249 1.721v3.275l5.725-2.832zM9.935 7.515V1.619l5.63 3.696v6.293L6.686 16V9.236l3.25-1.721z"
      />
    </svg>
  );
}
