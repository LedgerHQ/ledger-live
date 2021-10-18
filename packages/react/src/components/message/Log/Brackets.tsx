import React from "react";
import styled from "styled-components";
import FlexBox from "../../layout/Flex";

const SvgTop = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
`;

const SvgBottom = styled.svg`
  position: absolute;
  bottom: 0;
  left: 0;
`;

export const BracketLeft = (): React.ReactElement => (
  <FlexBox
    flex="0 0 1.2em"
    flexDirection="column"
    position="relative"
    justifyContent="space-between"
    alignItems="flex-start"
  >
    <SvgTop viewBox="0 0 64 64" fill="currentColor">
      <g>
        <path d="M 0,0 V 36.3452 H 8.05844 V 8.05844 H 55.3076 V 0 Z" />
      </g>
    </SvgTop>
    <SvgBottom viewBox="0 0 64 128" fill="currentColor">
      <g>
        <path d="M 0,91.6548 V 128 h 55.3076 v -8.06 H 8.05844 V 91.6548 Z" />
      </g>
    </SvgBottom>
  </FlexBox>
);

export const BracketRight = (): React.ReactElement => (
  <FlexBox
    flex="0 0 1.2em"
    flexDirection="column"
    position="relative"
    justifyContent="space-between"
    alignItems="flex-end"
  >
    <SvgTop viewBox="0 0 64 64" fill="currentColor">
      <g>
        <path d="M 8.692,0 V 8.05844 H 55.941 V 36.3452 H 64 V 0 Z" />
      </g>
    </SvgTop>
    <SvgBottom viewBox="0 0 64 128" fill="currentColor">
      <g>
        <path d="m 8.692,119.94 v 8.058 H 64 V 91.6548 H 55.941 V 119.94 Z" />
      </g>
    </SvgBottom>
  </FlexBox>
);
