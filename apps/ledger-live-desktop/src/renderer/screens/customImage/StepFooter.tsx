import React, { useCallback } from "react";
import { Flex, Button, InfiniteLoader, Divider } from "@ledgerhq/react-ui";
import { Step } from "./types";

type Props = {
  setStep?: (step: Step) => void;

  previousStep?: Step;
  nextStep?: Step;

  previousHidden?: boolean;
  previousDisabled?: boolean;
  previousLoading?: boolean;
  previousLabel?: string;
  previousTestId?: string;
  onClickPrevious?: () => void;

  nextHidden?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextLabel?: string;
  nextTestId?: string;
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
    onClickPrevious,
    nextHidden,
    nextDisabled,
    nextLoading,
    nextLabel,
    nextTestId,
    onClickNext,
  } = props;

  const handleNext = useCallback(() => {
    onClickNext ? onClickNext() : nextStep && setStep && setStep(nextStep);
  }, [onClickNext, setStep, nextStep]);

  const handlePrevious = useCallback(() => {
    onClickPrevious ? onClickPrevious() : previousStep && setStep && setStep(previousStep);
  }, [onClickPrevious, setStep, previousStep]);

  const showPrevious = !previousHidden && (previousStep || onClickPrevious);
  const showNext = !nextHidden && (nextStep || onClickNext);

  if (!showPrevious && !showNext) return null;
  return (
    <Flex flexDirection="column" alignSelf="stretch" mx={-16} mb={-5}>
      <Divider variant="light" />
      <Flex alignSelf="stretch" flexDirection="row" justifyContent="space-between" px={16} py={4}>
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
