import React, { useRef } from "react";
import styled from "styled-components";
import { useSpring, animated, interpolate } from "react-spring";
import useTheme from "~/renderer/hooks/useTheme";
import { ChartTooltipModel } from "chart.js";
import { Item } from "./types";

type TooltipContainerProps = {
  opacity: number;
};

const TooltipContainer = styled.div.attrs<TooltipContainerProps>(({ opacity }) => ({
  style: {
    display: opacity ? "block" : "none",
  },
}))<TooltipContainerProps>`
  transform: translate3d(-50%, -100%, 0);
  background: ${p => p.theme.colors.palette.background.paper};
  border: 1px solid ${p => p.theme.colors.palette.text.shade10};
  border-radius: 4px;
  width: 150px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.03);
  text-align: center;
  padding: 12px 10px;
`;

type TooltipProps = {
  tooltip: ChartTooltipModel;
  renderTooltip: (data: Item) => React.ReactNode;
  color?: string;
  data: Item[];
};

const Tooltip = ({ tooltip, renderTooltip, color, data }: TooltipProps) => {
  const wasVisible = useRef(false);
  const theme = useTheme();
  const { x, y } = useSpring<{
    x: number;
    y: number;
  }>({
    x: tooltip.caretX,
    y: tooltip.caretY,
    reset: !wasVisible.current,
  });
  wasVisible.current = !!tooltip.opacity;
  const index = tooltip.dataPoints?.[0]?.index;
  const tooltipData = index !== undefined ? data?.[index] : null;
  return (
    <>
      <div
        style={{
          transform: `translate3d(${tooltip.caretX}px,${tooltip.caretY}px,0)`,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          display: tooltip.opacity ? "block" : "none",
        }}
      >
        <svg
          height="10"
          width="10"
          style={{
            transform: "translate(-50%,-100%)",
            transformOrigin: "50% 50%",
          }}
        >
          <circle
            cx="5"
            cy="5"
            r="4"
            stroke={color}
            strokeWidth="2"
            fill={theme.colors.palette.background.paper}
          />
        </svg>
      </div>
      <animated.div
        style={{
          transform: interpolate([x, y], (x, y) => `translate3d(${x}px,${y - 35}px,0)`),
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {tooltipData && (
          <TooltipContainer opacity={tooltip.opacity}>
            {renderTooltip(tooltipData)}
          </TooltipContainer>
        )}
      </animated.div>
    </>
  );
};
export default Tooltip;
