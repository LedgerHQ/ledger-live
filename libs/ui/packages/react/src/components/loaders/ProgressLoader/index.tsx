import React from "react";
import styled from "styled-components";
import Text from "../../asorted/Text";

export interface Props {
  /**
   * Radius of the progress ring.
   */
  radius?: number;

  /**
   * Thickness of the progress ring.
   */
  stroke?: number;

  /**
   * Progress of the loader, in percent, between 0 and 100.
   */
  progress?: number;

  /**
   * Whether to make it infinite, with spinning and whatnot.
   */
  infinite?: boolean;

  /**
   * Whether to display the progress, defaults to true.
   */
  showPercentage?: boolean;

  /**
   * Percentage text color
   */
  textColor?: string;

  /**
   * Front stroke color.
   */
  frontStrokeColor?: string;

  /**
   * Front stroke linecap.
   * https://developer.mozilla.org/fr/docs/Web/SVG/Attribute/stroke-linecap
   */
  frontStrokeLinecap?: "butt" | "round";

  /**
   * Background stroke color.
   */
  backgroundStrokeColor?: string;
}

const StyledCircle = styled.circle.attrs({
  fill: "transparent",
  cx: "50%",
  cy: "50%",
})`
  transition: stroke-dashoffset 0.35s;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
`;

const StyledCircleBackground = styled(StyledCircle).attrs(props => ({
  stroke: props.stroke || props.theme.colors.primary.c30,
}))``;

const StyledCircleFront = styled(StyledCircle).attrs(props => ({
  stroke: props.stroke || props.theme.colors.primary.c80,
}))``;

const StyledCenteredText = styled(Text)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const StyledProgressLoaderContainer = styled.div`
  display: flex;
  position: absolute;
`;
const StyledSpinningContainer = styled.div`
  animation: rotation 1s infinite linear;
  display: flex;
  align-items: center;
  justify-content: center;
  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

function ProgressCircleSvg({
  radius,
  stroke,
  progress,
  backgroundStrokeColor,
  frontStrokeColor,
  frontStrokeLinecap,
}: {
  radius: number;
  stroke: number;
  progress: number;
  backgroundStrokeColor?: string;
  frontStrokeColor?: string;
  frontStrokeLinecap?: "butt" | "round" | "square";
}) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  return (
    <svg height={radius * 2} width={radius * 2}>
      <StyledCircleBackground
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset: 0 }}
        stroke={backgroundStrokeColor}
        r={normalizedRadius}
      />
      <StyledCircleFront
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset }}
        stroke={frontStrokeColor}
        strokeLinecap={frontStrokeLinecap}
        r={normalizedRadius}
      />
    </svg>
  );
}

export default function ProgressLoader({
  radius = 32,
  stroke = 6,
  progress = 0,
  showPercentage = true,
  infinite,
  textColor,
  frontStrokeColor,
  frontStrokeLinecap,
  backgroundStrokeColor,
}: Props): JSX.Element {
  return (
    <StyledProgressLoaderContainer>
      {showPercentage && (
        <StyledCenteredText variant="body" color={textColor || "primary.c80"}>
          {Math.floor(progress)}%
        </StyledCenteredText>
      )}
      {infinite ? (
        <StyledSpinningContainer>
          <ProgressCircleSvg
            radius={radius}
            stroke={stroke}
            progress={25}
            frontStrokeColor={frontStrokeColor}
            frontStrokeLinecap={frontStrokeLinecap}
            backgroundStrokeColor={backgroundStrokeColor}
          />
        </StyledSpinningContainer>
      ) : (
        <ProgressCircleSvg
          radius={radius}
          stroke={stroke}
          progress={progress}
          frontStrokeColor={frontStrokeColor}
          frontStrokeLinecap={frontStrokeLinecap}
          backgroundStrokeColor={backgroundStrokeColor}
        />
      )}
    </StyledProgressLoaderContainer>
  );
}
