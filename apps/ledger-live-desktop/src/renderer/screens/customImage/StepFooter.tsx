import React, { useCallback } from "react";
import { Flex, Button, InfiniteLoader, Divider } from "@ledgerhq/react-ui";
import { Step } from "./types";
import { track } from "~/renderer/analytics/segment";

type Props = {
  setStep?: (step: Step) => void;

  previousStep?: Step;
  nextStep?: Step;

  previousHidden?: boolean;
  previousDisabled?: boolean;
  previousLoading?: boolean;
  previousLabel?: string;
  previousTestId?: string;
  previousEventProperties?: Record<string, unknown>;
  onClickPrevious?: () => void;

  nextHidden?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextLabel?: string;
  nextTestId?: string;
  nextEventProperties?: Record<string, unknown>;
  onClickNext?: () => void;
};

const StepFooter: React.FC<Props> = props => {
  const {
    setStep,
    previousStep,
    nextStep,

    previousHidden,
    previousDisabled,
    previousLoading,
    previousLabel,
    previousTestId,
    previousEventProperties,
    onClickPrevious,
    nextHidden,
    nextDisabled,
    nextLoading,
    nextLabel,
    nextTestId,
    nextEventProperties,
    onClickNext,
  } = props;

  const handleNext = useCallback(() => {
    nextEventProperties && track("button_clicked", nextEventProperties);
    onClickNext ? onClickNext() : nextStep && setStep && setStep(nextStep);
  }, [nextEventProperties, onClickNext, nextStep, setStep]);

  const handlePrevious = useCallback(() => {
    previousEventProperties && track("button_clicked", previousEventProperties);
    onClickPrevious ? onClickPrevious() : previousStep && setStep && setStep(previousStep);
  }, [onClickPrevious, previousEventProperties, previousStep, setStep]);

  const showPrevious = !previousHidden && (previousStep || onClickPrevious);
  const showNext = !nextHidden && (nextStep || onClickNext);

  if (!showPrevious && !showNext) return null;
  return (
    <Flex flexDirection="column" alignSelf="stretch">
      <Divider />
      <Flex
        px={12}
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between"
        pt={4}
        pb={1}
      >
        {showPrevious ? (
          <Button
            variant="main"
            outline
            onClick={previousDisabled ? undefined : handlePrevious}
            disabled={previousDisabled}
            Icon={previousLoading ? InfiniteLoader : undefined}
            data-test-id={previousTestId}
          >
            {previousLabel}
          </Button>
        ) : (
          <Flex flex={1} />
        )}
        {showNext ? (
          <Button
            variant="main"
            onClick={nextDisabled ? undefined : handleNext}
            disabled={nextDisabled}
            Icon={nextLoading ? InfiniteLoader : undefined}
            data-test-id={nextTestId}
          >
            {nextLabel}
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default StepFooter;
