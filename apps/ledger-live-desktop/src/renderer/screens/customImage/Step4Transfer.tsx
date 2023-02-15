import React, { useCallback, useState } from "react";
import { ProcessorResult } from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import { Step, StepProps } from "./types";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import StepFooter from "./StepFooter";
import StepContainer from "./StepContainer";
import TestImage from "~/renderer/components/CustomImage/TestImage";
import { useSelector } from "react-redux";
import CustomImageDeviceAction from "~/renderer/components/CustomImage/CustomImageDeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";

type Props = StepProps & {
  result?: ProcessorResult;
  onResult: () => void;
  onExit: () => void;
};

const DEBUG = false;
const StepTransfer: React.FC<Props> = props => {
  const { result, setStep, onError, onResult, onExit } = props;
  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const { t } = useTranslation();

  const device = useSelector(getCurrentDevice);

  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  const handleResult = useCallback(() => {
    onResult();
  }, [onResult]);

  const handleTryAnotherImage = useCallback(() => {
    setStep(Step.chooseImage);
  }, [setStep]);

  return (
    <StepContainer
      footer={
        <StepFooter
          previousStep={Step.chooseContrast}
          previousLabel={t("common.previous")}
          previousDisabled={navigationBlocked}
          setStep={setStep}
        />
      }
    >
      {result ? (
        <Flex flex={1} px={12}>
          <CustomImageDeviceAction
            device={device}
            hexImage={result?.rawResult.hexData}
            source={result?.previewResult.imageBase64DataUri}
            onResult={handleResult}
            onSkip={handleExit}
            onTryAnotherImage={handleTryAnotherImage}
            blockNavigation={setNavigationBlocked}
          />
        </Flex>
      ) : null}
      {DEBUG ? <TestImage result={result} onError={onError} /> : null}
    </StepContainer>
  );
};

export default StepTransfer;
