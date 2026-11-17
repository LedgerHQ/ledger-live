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
const NanoSSwivel = ({ angle, ...props }: Props) => {
  const type = useTheme().theme;
  return (
    <SwivelSVG {...props} width="140" height="42">
      <defs />
      <defs>
        <path
          id="bbbb"
          d="M218 2c1.104569 0 2 .8954305 2 2v38c0 1.1045695-.895431 2-2 2H110c-11.5979797 0-21-9.4020203-21-21s9.4020203-21 21-21h108zM110 13c-5.522847 0-10 4.4771525-10 10s4.477153 10 10 10 10-4.4771525 10-10-4.477153-10-10-10z"
        />
      </defs>
      <g
        style={{
          ...swivelTransition,
          transform: `rotate(${angle}deg)`,
          transformOrigin: "110px 23px",
        }}
      >
        <g transform="rotate(180, 70, 21)">
          <g transform="translate(-80 -4)" fill={colors[type].swivel} fillRule="evenodd">
            <use xlinkHref="#bbbb" />
            <path
              stroke={colors[type].stroke}
              strokeWidth="2"
              d="M218 3H110c-11.045695 0-20 8.954305-20 20s8.954305 20 20 20h108c.552285 0 1-.4477153 1-1V4c0-.55228475-.447715-1-1-1zm-108 9c6.075132 0 11 4.9248678 11 11s-4.924868 11-11 11-11-4.9248678-11-11 4.924868-11 11-11z"
            />
          </g>
        </g>
      </g>
    </SwivelSVG>
  );
};
export default NanoSSwivel;
