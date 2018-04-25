//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Neo({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M7.706 6.39v9.373l-6.95-4.717v-7.86H.79L.755 3.17 8.364.229l6.649 3.3-.028.012h.018l-.01 9.787L9 9.68V5.884l-1.294.507zm-5.45-2.454v6.315l3.95 2.68V5.953l-3.95-2.016zm8.244 1.36v3.542l2.996 1.823.006-6.54L10.5 5.297zM4.425 3.36l3 1.531 3.888-1.522-3.025-1.502L4.425 3.36z"
      />
    </svg>
  );
}
