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
import { ImageCommitRefusedOnDevice, ImageLoadRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { analyticsDrawerName, analyticsFlowName, analyticsPageNames } from "./shared";
import TrackPage from "~/renderer/analytics/TrackPage";

type Props = StepProps & {
  result?: ProcessorResult;
  onResult: () => void;
  onExit: () => void;
};

const DEBUG = false;
const StepTransfer: React.FC<Props> = props => {
  const { result, setStep, onError, onResult, onExit } = props;
  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const [error, setError] = useState<Error | null | undefined>(null);
  const [nonce, setNonce] = useState(0);
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

  const onRetry = useCallback(() => {
    setError(null);
    setNonce(nonce => nonce + 1);
  }, []);

  const isRefusedOnStaxError =
    error instanceof ImageLoadRefusedOnDevice ||
    (error as unknown) instanceof ImageCommitRefusedOnDevice;

  return (
    <StepContainer
      key={`${nonce}_customImage`}
      footer={
        <StepFooter
          previousStep={Step.chooseContrast}
          previousLabel={t("common.back")}
          previousDisabled={navigationBlocked}
          setStep={setStep}
          nextLabel={
            error
              ? isRefusedOnStaxError
                ? t("customImage.steps.transfer.useAnotherPicture")
                : t("common.retry")
              : ""
          }
          onClickNext={error ? (isRefusedOnStaxError ? handleTryAnotherImage : onRetry) : undefined}
          previousEventProperties={{
            button: "Previous",
          }}
          nextEventProperties={
            error
              ? {
                  button: error
                    ? isRefusedOnStaxError
                      ? "Upload another image"
                      : "Retry"
                    : undefined,
                  drawer: analyticsDrawerName,
                }
              : {}
          }
        />
      }
    >
      {result ? (
        <Flex flex={1} px={12}>
          {error ? (
            <TrackPage
              category={analyticsPageNames.error + error.name}
              type="drawer"
              flow={analyticsFlowName}
              refreshSource={false}
            />
          ) : null}
          <CustomImageDeviceAction
            device={device}
            hexImage={result?.rawResult.hexData}
            source={result?.previewResult.imageBase64DataUri}
            inlineRetry={false}
            onResult={handleResult}
            onError={setError}
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
