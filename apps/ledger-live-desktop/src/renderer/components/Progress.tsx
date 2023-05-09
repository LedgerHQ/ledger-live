import React from "react";
import styled, { keyframes, css } from "styled-components";
import { color } from "styled-system";
import Box from "~/renderer/components/Box";

const infiniteAnimation = keyframes`
  0% {
    transform: translateX(-80%) scaleX(0.2);
  }
  50% {
    transform: translateX(0%) scaleX(0.5);
  }
  100% {
    transform: translateX(80%) scaleX(0.2);
  }
`;

const fillInAnimation = keyframes`
  0% {
    transform: translate3d(-110%, 0, 0);
  }
  50% {
    transform: translate3d(-30%, 0, 0);
  }
  100% {
    transform: translate3d(0);
  }
`;

const Bar = styled(Box).attrs(() => ({
  borderRadius: "2.5px",
}))`
  height: 5px;
  width: 100%;
  position: relative;
  background-color: currentColor;
  overflow: hidden;
  ${color}
`;

const Progression = styled(Bar).attrs<{
  infinite?: boolean;
  timing: number;
  progress?: number;
}>(p =>
  p.progress && !isNaN(p.progress)
    ? {
        style: {
          transform: `scaleX(${p.progress})`,
        },
        transformOrigin: "left",
        animation: "none",
      }
    : {
        transformOrigin: p.infinite ? "center" : "left",
        animation: css`
      ${p.timing}ms ${p.infinite ? infiniteAnimation : fillInAnimation} ${
          p.infinite ? "infinite" : "ease-out forwards"
        }
    `,
      },
)<{
  infinite?: boolean;
  timing: number;
  progress?: number;
}>`
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
`;

type Props = {
  infinite?: boolean;
  timing?: number;
  color?: string;
  progress?: number;
};

const Progress = ({
  infinite = false,
  timing = 2500,
  color = "wallet",
  progress = undefined,
}: Props) => {
  return (
    <Bar color="palette.divider">
      <Progression infinite={infinite} bg={color} timing={timing} progress={progress} />
    </Bar>
  );
};

export default Progress;
