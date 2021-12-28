import React, { useMemo } from "react";
import styled, { useTheme } from "styled-components/native";
import { space, SpaceProps, color, ColorProps } from "styled-system";
import Text from "../../Text";
import CheckAlone from "@ledgerhq/icons-ui/native/CheckAloneMedium";
import CloseMedium from "@ledgerhq/icons-ui/native/CloseMedium";
import Animated, { useAnimatedStyle, withTiming, withDelay, Easing } from "react-native-reanimated";

// #region Separator
type AnimatedSeparatorProps = {
  filled: boolean;
  delay: number;
  duration: number;
};

const Separator = styled.View<SpaceProps>`
  flex: 1;
  height: 1px;
  background-color: ${(p) => p.theme.colors.neutral.c40};
  ${space}
`;

const SeparatorFilling = Animated.createAnimatedComponent(styled.View`
  height: 100%;
  background-color: ${(p) => p.theme.colors.neutral.c100};
`);

const AnimatedSeparator = ({
  filled,
  delay,
  duration,
  ...spaceProps
}: AnimatedSeparatorProps & SpaceProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withDelay(
      delay,
      withTiming(filled ? "100%" : "0%", {
        duration: duration,
        easing: Easing.linear,
      }),
    ),
  }));

  return (
    <Separator {...spaceProps}>
      <SeparatorFilling style={[animatedStyle]} />
    </Separator>
  );
};

// #endregion

// #region StepIcon
const StepIcon = {
  Container: styled.View<SpaceProps>`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    ${space}
  `,
  Background: styled.View<ColorProps>`
    justify-content: center;
    align-items: center;
    flex-direction: row;
    width: ${(p) => p.theme.space[5]}px;
    height: ${(p) => {
      /* the height of the background has to be odd, so we can correctly predict where the center pixel is
        and align the separators accordingly */
      const baseSpace = p.theme.space[5];
      return baseSpace % 2 === 0 ? baseSpace + 1 : baseSpace;
    }}px;
    border-radius: ${(p) => p.theme.radii[2]}px;
    overflow: hidden;
    margin-right: ${(p) => p.theme.space[1]}px;
    margin-left: ${(p) => p.theme.space[1]}px;
    ${color}
  `,
  Current: styled.View`
    width: ${(p) => p.theme.space[2]}px;
    height: ${(p) => p.theme.space[2]}px;
    border-radius: ${(p) => p.theme.radii[2]}px;
    background-color: ${(p) => p.theme.colors.primary.c90};
  `,
  Pending: styled.View`
    width: ${(p) => p.theme.space[1]}px;
    height: ${(p) => p.theme.space[1]}px;
    border-radius: ${(p) => p.theme.space[1]}px;
    background-color: ${(p) => p.theme.colors.neutral.c70};
  `,
  Completed: ({ color }: { color: string }): JSX.Element => <CheckAlone size={16} color={color} />,
  Errored: ({ color }: { color: string }): JSX.Element => <CloseMedium size={16} color={color} />,
};
// #endregion

// #region Step
const StepView = styled.View`
  align-items: center;
  justify-content: center;
`;

const ActiveText = styled(Text)`
  color: ${(p) => p.theme.colors.neutral.c100};
`;

const PendingText = styled(Text)`
  color: ${(p) => p.theme.colors.neutral.c70};
`;

const ErroredText = styled(Text)`
  color: ${(p) => p.theme.colors.error.c100};
`;

type StepState = "CURRENT" | "PENDING" | "COMPLETED" | "ERRORED";

type StepProps = {
  state: StepState;
  label: string;
  showLeftSeparator?: boolean;
  showRightSeparator?: boolean;
};

function Step({
  state,
  label,
  showLeftSeparator,
  showRightSeparator,
}: StepProps): React.ReactElement {
  const labelText = useMemo(() => {
    switch (state) {
      case "COMPLETED":
      case "CURRENT":
        return <ActiveText>{label}</ActiveText>;
      case "ERRORED":
        return <ErroredText>{label}</ErroredText>;
      case "PENDING":
        return <PendingText>{label}</PendingText>;
    }
  }, [state, label]);

  const { colors } = useTheme();
  const icon = useMemo(() => {
    switch (state) {
      case "COMPLETED":
        return (
          <StepIcon.Background backgroundColor="primary.c20">
            <StepIcon.Completed color={colors.primary.c90} />
          </StepIcon.Background>
        );
      case "CURRENT":
        return (
          <StepIcon.Background backgroundColor="primary.c20">
            <StepIcon.Current />
          </StepIcon.Background>
        );
      case "ERRORED":
        return (
          <StepIcon.Background backgroundColor="warning.c30">
            <StepIcon.Errored color={colors.error.c100} />
          </StepIcon.Background>
        );
      case "PENDING":
        return (
          <StepIcon.Background>
            <StepIcon.Pending />
          </StepIcon.Background>
        );
    }
  }, [state, colors]);

  return (
    <StepView>
      <StepIcon.Container mb={2}>
        {showLeftSeparator && (
          <AnimatedSeparator
            filled={state !== "PENDING"}
            duration={100}
            delay={state !== "PENDING" ? 350 : 0}
          />
        )}
        {icon}
        {showRightSeparator && (
          <AnimatedSeparator
            filled={state === "COMPLETED"}
            duration={100}
            delay={state === "COMPLETED" ? 0 : 350}
          />
        )}
      </StepIcon.Container>
      {labelText}
    </StepView>
  );
}
// #endregion

// #region Stepper
export type StepperProps = {
  /**
   * An array of labels that will determine the progress bar steps.
   */
  steps: string[];
  /**
   * Index of the active step, starting at zero and defaulting to 0 if omitted.
   */
  activeIndex?: number;
  /**
   * If true the current step is considered as a failure.
   */
  errored?: boolean;
};

const Container = styled.View`
  flex-direction: row;
  width: 100%;
`;

function Stepper({ steps, activeIndex, errored }: StepperProps): React.ReactElement {
  const { space } = useTheme();

  const separatorMarginTop = useMemo(() => Math.floor(space[5] / 2), [space]);
  return (
    <Container>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <Step
            label={label}
            state={
              i === activeIndex
                ? errored
                  ? "ERRORED"
                  : "CURRENT"
                : i < (activeIndex ?? 0)
                ? "COMPLETED"
                : "PENDING"
            }
            showLeftSeparator={i > 0}
            showRightSeparator={i < steps.length - 1}
          />
          {i < steps.length - 1 ? (
            <AnimatedSeparator
              filled={i < (activeIndex ?? 0)}
              duration={250}
              delay={100}
              mt={separatorMarginTop}
            />
          ) : null}
        </React.Fragment>
      ))}
    </Container>
  );
}
// #endregion

export default Stepper;
