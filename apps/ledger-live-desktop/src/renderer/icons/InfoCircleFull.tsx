import React, { useMemo } from "react";
type Props = {
  size?: number;
  color?: string;
};
export default function InfoCircleFull({ size = 16, color = "currentColor" }: Props) {
  return useMemo(() => {
    return (
      <svg viewBox="0 0 20 20" height={size} width={size}>
        <path
          d="M0 9.99902C0 15.522 4.477 19.999 10 19.999C15.523 19.999 20 15.522 20 9.99902C20 4.47602 15.523 -0.000976562 10 -0.000976562C4.477 -0.000976562 0 4.47602 0 9.99902ZM9 6.99902V4.99902H11V6.99902H9ZM9 14.999V8.99902H11V14.999H9Z"
          fill={color}
        />
      </svg>
    );
  }, [size, color]);
}
