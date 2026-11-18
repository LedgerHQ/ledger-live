import React from "react";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";
import colors from "../colors";
const SwivelSVG = styled.svg`
  overflow: visible;
`;
const swivelTransition = { transition: "transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)" };
type Props = {
  angle: number;
};
const NanoXSwivel = ({ angle, ...props }: Props) => {
  const type = useTheme().theme;
  return (
    <SwivelSVG {...props} width="156" height="42">
      <defs />
      <g
        style={{
          ...swivelTransition,
          transform: `rotate(${angle}deg)`,
          transformOrigin: "135px 21px",
        }}
      >
        <path
          transform={`rotate(180, 78, 21)`}
          fill={colors[type].swivel}
          fillRule="evenodd"
          stroke={colors[type].stroke}
          strokeWidth="2"
          d="M151.985 1h-131c-11.046 0-20 8.954-20 20s8.954 20 20 20h131a3 3 0 003-3V4a3 3 0 00-3-3zM21 9c6.627 0 12 5.373 12 12s-5.373 12-12 12S9 27.627 9 21 14.373 9 21 9z"
        />
      </g>
    </SwivelSVG>
  );
};
export default NanoXSwivel;
