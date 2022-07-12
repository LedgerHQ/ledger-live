import React from "react";
import styled from "styled-components";
import { Box } from "@ledgerhq/react-ui";

const Bar = styled(Box).attrs((p: {percentage: number}) => ({
  "position": "absolute",
  "top": 0,
  "left": 0,
  "right": 0,
  "height": "4px",
  "width": `${p.percentage}%`,
  backgroundColor: "neutral.c100",
}))`
  transition: width ease-out 200ms;
`;

const ProgressBar = ({ stepIndex, stepCount }: {stepIndex: number, stepCount: number}) => {
  return <Bar percentage={100 * ((stepIndex + 1) / stepCount)} />;
};

export default ProgressBar;
