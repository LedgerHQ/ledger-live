import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function Trash({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M2 4.832a.75.75 0 1 1 0-1.5h11.917a.75.75 0 0 1 0 1.5H2zm9.843-.75h1.5v9.037c0 1.131-.933 2.04-2.074 2.04h-6.62c-1.142 0-2.075-.909-2.075-2.04V4.082h1.5v9.037c0 .294.253.54.574.54h6.62c.322 0 .575-.246.575-.54V4.082zm-5.783 0h-1.5V2.79c0-1.131.933-2.04 2.074-2.04h2.648c1.142 0 2.074.91 2.074 2.041v1.29h-1.5v-1.29c0-.294-.252-.541-.574-.541H6.634c-.321 0-.574.247-.574.541v1.29zm-.176 3.227a.75.75 0 0 1 1.5 0v3.873a.75.75 0 0 1-1.5 0V7.31zm2.648 0a.75.75 0 0 1 1.5 0v3.873a.75.75 0 0 1-1.5 0V7.31z"
      />
    </Svg>
  );
}
