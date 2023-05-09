import React from "react";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";
import colors from "../colors";
const FrameSVG = styled.svg`
  overflow: visible;
`;
type Props = {
  children: React.ReactNode;
  overlay: React.ReactNode;
  error?: boolean;
};
const BlueFrame = ({ children, overlay, error }: Props) => {
  const type = useTheme("colors.palette.type") as keyof typeof colors;
  return (
    <FrameSVG width="118" height="144">
      <defs />
      <defs>
        <rect id="abc" width="116" height="144" x="0" y="0" rx="6" />
      </defs>
      <g fill="none" fillRule="evenodd">
        <use fill={colors[type].frame} xlinkHref="#abc" />
        <rect
          width="114"
          height="142"
          x="1"
          y="1"
          fill={error ? colors[type].errorFrame : colors[type].frame}
          stroke={colors[type].stroke}
          strokeWidth="2"
          rx="6"
        />
        <rect width="4" height="12" x="114" y="16" fill={colors[type].stroke} rx="2" />
      </g>
      {children}
      {overlay}
    </FrameSVG>
  );
};
export default BlueFrame;
