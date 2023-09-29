// @flow

import React from "react";

const AddLiquidity = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" fill="none" height={size} width={size}>
    <path
      d="m1 8 6.999-7L15 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m1 14 6.999-7L15 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default AddLiquidity;
