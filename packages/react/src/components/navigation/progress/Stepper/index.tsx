import React, { memo } from "react";
import styled from "styled-components";
import { border, BorderProps, color, ColorProps, space, SpaceProps } from "styled-system";
import CheckAlone from "@ledgerhq/icons-ui/react/CheckAloneMedium";
import CloseMedium from "@ledgerhq/icons-ui/react/CloseMedium";
import Text from "../../../asorted/Text";
import Flex from "../../../layout/Flex";

/**
 * The state of a progress bar step.
 */
export type StepState = "pending" | "current" | "completed" | "errored";

type LabelType =
  | string
  | React.ComponentType<{ state: StepState }>
  | ((props: { state: StepState }) => JSX.Element);
export interface Props {
  /**
   * An array of labels that will determine the progress bar steps.
   *  A label is either a string or a component that will be rendered with the
   *  prop `state: "pending" | "current" | "completed" | "errored"`.
   *  A styled StepText component is exported to allow easy styling of such a custom label.
   */
  steps: LabelType[];
  /**
   * Index of the active step, starting at zero and defaulting to 0 if omitted.
   */
  activeIndex?: number;
  /**
   * If true the current step is considered as a failure.
   */
  errored?: boolean;
}

export type StepProps = {
  /**
   * State of the step.
   */
  state: StepState;
  /**
   * The label to display. To display more than text, this can be a component that will be rendered with the
   *  prop `state: "pending" | "current" | "completed" | "errored"`.
   *  A styled StepText component is exported to allow easy styling of such a custom Label
   */
  label: LabelType;
  /**
   * If true, hides the left "separator" bar that bridges the gap between the wider separator and the item.
   */
  hideLeftSeparator: boolean;
  /**
   * The next step state, or undefined if the current step is the last one.
   */
  nextState?: StepState;
};

export const Item = {
  Container: styled.div.attrs({
    mx: "8px",
  })<ColorProps & BorderProps & SpaceProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${(p) => p.theme.space[8]}px;
    height: ${(p) => p.theme.space[8]}px;
    ${color}
    ${border}
    ${space}
  `,
  Spacer: styled.div<SpaceProps>`
    display: flex;
    align-self: stretch;
    ${space}
  `,
  Current: styled.div.attrs({
    backgroundColor: "primary.c90",
  })<ColorProps>`
    width: 6px;
    height: 6px;
    border-radius: 6px;
    ${color}
  `,
  Pending: styled.div.attrs({
    backgroundColor: "neutral.c70",
  })<ColorProps>`
    width: ${(p) => p.theme.space[2]}px;
    height: ${(p) => p.theme.space[2]}px;
    border-radius: ${(p) => p.theme.space[2]}px;
    ${color}
  `,
  Completed: (): JSX.Element => <CheckAlone size={16} />,
  Errored: (): JSX.Element => <CloseMedium size={16} />,
};

export const StepText = styled(Text)<{ state: StepState }>`
  color: ${(p) => {
    if (p.state === "errored") {
      return p.theme.colors.error.c100;
    }
    if (p.state === "pending") {
      return p.theme.colors.neutral.c70;
    }
    return p.theme.colors.neutral.c100;
  }};
`;

const BaseSeparator = styled.div<{ inactive?: boolean }>`
  flex: 1;
  position: relative;
  overflow-x: hidden;
  background-color: ${(p) => p.theme.colors.neutral.c40};
  height: 1px;
  top: ${(p) => p.theme.space[5]}px;
`;

const Separator = {
  Step: styled(BaseSeparator)``,
  Item: styled(BaseSeparator)<{ position: string }>``,
};

const stepContentsByState = {
  pending: (
    <Item.Container>
      <Item.Pending />
    </Item.Container>
  ),
  current: (
    <Item.Container backgroundColor="primary.c20" borderRadius="8px">
      <Item.Current />
    </Item.Container>
  ),
  completed: (
    <Item.Container color="primary.c90" backgroundColor="primary.c20" borderRadius="8px">
      <Item.Completed />
    </Item.Container>
  ),
  errored: (
    <Item.Container color="error.c100" backgroundColor="warning.c30" borderRadius="8px">
      <Item.Errored />
    </Item.Container>
  ),
};

export const Step = memo(function Step({
  state,
  label: Label,
  hideLeftSeparator = true,
  nextState,
}: StepProps): JSX.Element {
  const inactive = state === "pending";
  const nextInactive = state === "pending";

  return (
    <Flex flexDirection="column" alignItems="center">
      <Item.Spacer mb={5}>
        {(!hideLeftSeparator && <Separator.Item inactive={inactive} position="left" />) || (
          <Flex flex="1" />
        )}
        {stepContentsByState[state]}
        {(nextState && <Separator.Item inactive={nextInactive} position="right" />) || (
          <Flex flex="1" />
        )}
      </Item.Spacer>
      {typeof Label === "string" ? (
        <StepText state={state} variant="small">
          {Label}
        </StepText>
      ) : (
        <Label state={state} />
      )}
    </Flex>
  );
});

function getState(activeIndex: number, index: number, errored?: boolean) {
  if (activeIndex < index) {
    return "pending";
  }
  if (activeIndex === index) {
    return errored ? "errored" : "current";
  }
  return "completed";
}

function ProgressSteps({ steps, activeIndex = 0, errored }: Props) {
  return (
    <Flex flexWrap="nowrap" justifyContent="space-between">
      {steps.map((step, idx) => {
        const state = getState(activeIndex, idx, errored);
        const nextState = idx < steps.length - 1 ? getState(activeIndex, idx + 1) : undefined;
        return (
          <>
            {idx > 0 && <Separator.Step inactive={state === "pending"} />}
            <Step label={step} state={state} nextState={nextState} hideLeftSeparator={idx === 0} />
          </>
        );
      })}
    </Flex>
  );
}

export default memo(ProgressSteps);
