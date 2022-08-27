// @flow

import React from "react";

type Props = {
  size?: number | string;
  color?: string;
};

function Burn({ size = 16, color = "currentColor" }: Props): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 29" fill={color}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.242 9.136L12 .894 3.758 9.136h.001c-4.377 4.498-4.34 11.693.112 16.145 4.49 4.49 11.768 4.49 16.258 0 4.452-4.452 4.49-11.647.112-16.145zm-3.966 3.943L12 8.803l-4.276 4.276a5.964 5.964 0 108.551 0z"
      />
    </svg>
  );
}

export default Burn;
