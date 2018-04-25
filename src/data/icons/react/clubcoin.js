//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function Clubcoin({ size, color = "currentColor" }: Props) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        fill={color}
        d="M12.726 11.08l.518-.646 1.292 1.037-.519.646c-1.872 2.333-5.111 3.279-8.051 2.362C3.008 13.556 1 10.949 1 7.997c0-2.952 2.008-5.56 4.966-6.482 2.94-.917 6.179.028 8.051 2.362l.519.646-1.292 1.037-.518-.646c-1.442-1.796-3.97-2.534-6.267-1.818-2.279.712-3.802 2.69-3.802 4.9 0 2.213 1.523 4.19 3.802 4.901 2.297.717 4.825-.021 6.267-1.817zM7.339 2.829H5.683V0h1.656v2.829zm3.46 0H9.144V0H10.8v2.829zM7.34 16H5.683v-2.829h1.656V16zm3.46 0H9.144v-2.829H10.8V16z"
      />
    </svg>
  );
}
