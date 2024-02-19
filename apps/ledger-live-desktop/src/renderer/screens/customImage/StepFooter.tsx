import React, { useCallback } from "react";
import { Flex, InfiniteLoader, Divider } from "@ledgerhq/react-ui";
import ButtonV3 from "~/renderer/components/ButtonV3";
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
    onClickNext ? onClickNext() : nextStep && setStep && setStep(nextStep);
  }, [onClickNext, nextStep, setStep]);

  const handlePrevious = useCallback(() => {
    onClickPrevious ? onClickPrevious() : previousStep && setStep && setStep(previousStep);
  }, [onClickPrevious, previousStep, setStep]);

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
          <ButtonV3
            variant="main"
            outline
            onClick={previousDisabled ? undefined : handlePrevious}
            disabled={previousDisabled}
            Icon={previousLoading ? InfiniteLoader : undefined}
            buttonTestId={previousTestId}
            event="button_clicked2"
            eventProperties={previousEventProperties}
          >
            {previousLabel}
          </ButtonV3>
        ) : (
          <Flex flex={1} />
        )}
        {showNext ? (
          <ButtonV3
            variant="main"
            onClick={nextDisabled ? undefined : handleNext}
            disabled={nextDisabled}
            Icon={nextLoading ? InfiniteLoader : undefined}
            buttonTestId={nextTestId}
            event="button_clicked2"
            eventProperties={nextEventProperties}
          >
            {nextLabel}
          </ButtonV3>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default StepFooter;
