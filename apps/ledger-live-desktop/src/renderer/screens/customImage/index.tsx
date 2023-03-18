import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { BoxedIcon, Flex, FlowStepper, Icons, InfiniteLoader, Log, Text } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import { ImageDownloadError } from "@ledgerhq/live-common/customImage/errors";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { setPostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { useTranslation } from "react-i18next";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { CropParams } from "~/renderer/components/CustomImage/ImageCropper";
import { urlContentToDataUri } from "~/renderer/components/CustomImage/shared";
import { ProcessorResult } from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { withV2StyleProvider } from "~/renderer/styles/StyleProvider";
import StepChooseImage from "./Step1ChooseImage";
import StepAdjustImage from "./Step2AdjustImage";
import StepChooseContrast from "./Step3ChooseContrast";
import StepTransfer from "./Step4Transfer";
import { Step } from "./types";
import StepContainer from "./StepContainer";
import StepFooter from "./StepFooter";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";

type Props = {
  imageUri?: string;
  isFromNFTEntryPoint?: boolean;
  isFromPostOnboardingEntryPoint?: boolean;
  reopenPreviousDrawer?: () => void;
};

const orderedSteps: Step[] = [
  Step.chooseImage,
  Step.adjustImage,
  Step.chooseContrast,
  Step.transferImage,
];

const ErrorDisplayV2 = withV2StyleProvider(ErrorDisplay);

const CustomImage: React.FC<Props> = props => {
  const {
    imageUri,
    isFromNFTEntryPoint,
    reopenPreviousDrawer,
    isFromPostOnboardingEntryPoint,
  } = props;
  const { t } = useTranslation();

  const [stepError, setStepError] = useState<{ [key in Step]?: Error }>({});

  const [sourceLoading, setSourceLoading] = useState<boolean>(false);
  const [isShowingNftGallery, setIsShowingNftGallery] = useState<boolean>(false);

  const [loadedImage, setLoadedImage] = useState<ImageBase64Data>();
  const [croppedImage, setCroppedImage] = useState<ImageBase64Data>();
  const [finalResult, setFinalResult] = useState<ProcessorResult>();
  const [transferDone, setTransferDone] = useState(false);

  /**
   * Keeping a record of the crop params of a given image so that the cropping
   * state is not lost when unmounting the cropping step component.
   * */
  const [initialCropParams, setInitialCropParams] = useState<CropParams>();

  const [step, setStep] = useState<Step>(Step.chooseImage);

  const exit = useCallback(() => {
    setDrawer();
    if (reopenPreviousDrawer) reopenPreviousDrawer();
  }, [reopenPreviousDrawer]);

  const setStepWrapper = useCallback(
    (newStep: Step) => {
      if (step === Step.adjustImage && newStep === Step.chooseImage && isFromNFTEntryPoint) {
        exit();
        return;
      }
      setStepError({});
      setStep(newStep);
    },
    [step, isFromNFTEntryPoint, exit],
  );

  const initialUri = imageUri;

  useEffect(() => {
    let dead = false;
    if (initialUri && step === Step.chooseImage && !loadedImage) {
      setSourceLoading(true);
      urlContentToDataUri(initialUri)
        .then(res => {
          if (dead) return;
          setLoadedImage({ imageBase64DataUri: res });
          setStepWrapper(Step.adjustImage);
        })
        .catch(e => {
          console.error(e);
          if (dead) return;
          setStepError({ [Step.chooseImage]: new ImageDownloadError() });
        });
    }
    return () => {
      dead = true;
    };
  }, [setLoadedImage, loadedImage, initialUri, setStepWrapper, step]);

  useEffect(() => {
    if (loadedImage) setSourceLoading(false);
  }, [loadedImage]);

  const handleStepChooseImageResult: ComponentProps<
    typeof StepChooseImage
  >["onResult"] = useCallback(
    res => {
      setLoadedImage(res);
      setStepWrapper(Step.adjustImage);
    },
    [setStepWrapper],
  );

  const handleStepAdjustImageResult: ComponentProps<
    typeof StepAdjustImage
  >["onResult"] = useCallback(res => {
    setCroppedImage(res);
  }, []);

  const handleStepChooseContrastResult: ComponentProps<
    typeof StepChooseContrast
  >["onResult"] = useCallback(res => {
    setFinalResult(res);
  }, []);

  const handleStepTransferResult = useCallback(() => {
    // TODO: when post onboarding hub is merged: completeAction(PostOnboardingAction.customImage)
    setTransferDone(true);
  }, []);

  const handleErrorRetryClicked = useCallback(() => {
    setStepWrapper(Step.chooseImage);
  }, [setStepWrapper]);

  const handleError = useCallback(
    (step: Step, error: Error) => {
      setStepError({ [step]: error });
    },
    [setStepError],
  );

  /** just avoiding creating a new ref (and rerendering) for each step's onError */
  const errorHandlers: { [key in Step]: (error: Error) => void } = useMemo(
    () => ({
      [Step.adjustImage]: (...args) => handleError(Step.adjustImage, ...args),
      [Step.chooseContrast]: (...args) => handleError(Step.chooseContrast, ...args),
      [Step.chooseImage]: (...args) => handleError(Step.chooseImage, ...args),
      [Step.transferImage]: (...args) => handleError(Step.transferImage, ...args),
    }),
    [handleError],
  );

  const error = stepError[step];

  const previousStep: Step | undefined = orderedSteps[orderedSteps.findIndex(s => s === step) - 1];

  const openPostOnboarding = useNavigateToPostOnboardingHubCallback();
  const dispatch = useDispatch();

  useEffect(() => {
    if (transferDone && isFromPostOnboardingEntryPoint) {
      dispatch(setPostOnboardingActionCompleted({ actionId: PostOnboardingActionId.customImage }));
    }
  }, [dispatch, transferDone, isFromPostOnboardingEntryPoint]);

  const handleDone = useCallback(() => {
    exit();
    if (isFromPostOnboardingEntryPoint) {
      openPostOnboarding();
    }
  }, [exit, openPostOnboarding, isFromPostOnboardingEntryPoint]);

  const renderError = useMemo(
    () =>
      error
        ? () => {
            return (
              <StepContainer
                footer={
                  <StepFooter
                    previousStep={previousStep}
                    previousLabel={t("common.previous")}
                    setStep={setStepWrapper}
                  />
                }
              >
                <ErrorDisplayV2 error={error} onRetry={handleErrorRetryClicked} />
              </StepContainer>
            );
          }
        : undefined,
    [error, previousStep, t, setStepWrapper, handleErrorRetryClicked],
  );

  return (
    <Flex
      flexDirection="column"
      rowGap={5}
      height="100%"
      overflowY="hidden"
      width="100%"
      flex={1}
      data-test-id="custom-image-container"
    >
      <Text alignSelf="center" variant="h3Inter">
        {t("customImage.title")}
      </Text>
      {!transferDone ? (
        <FlowStepper.Indexed
          activeKey={step}
          extraStepperProps={{ errored: !!error }}
          extraStepperContainerProps={{ px: 12 }}
          extraContainerProps={{ overflowY: "hidden" }}
          extraChildrenContainerProps={{ overflowY: "hidden" }}
          renderChildren={renderError}
        >
          <FlowStepper.Indexed.Step
            itemKey={Step.chooseImage}
            label={t("customImage.steps.choose.stepLabel")}
          >
            {sourceLoading ? (
              <Flex flex={1} justifyContent="center" alignItems="center">
                <InfiniteLoader />
              </Flex>
            ) : (
              <StepChooseImage
                onError={errorHandlers[Step.chooseImage]}
                onResult={handleStepChooseImageResult}
                setStep={setStepWrapper}
                setLoading={setSourceLoading}
                isShowingNftGallery={isShowingNftGallery}
                setIsShowingNftGallery={setIsShowingNftGallery}
              />
            )}
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.adjustImage}
            label={t("customImage.steps.adjust.stepLabel")}
          >
            <StepAdjustImage
              src={loadedImage}
              onError={errorHandlers[Step.adjustImage]}
              onResult={handleStepAdjustImageResult}
              setStep={setStepWrapper}
              initialCropParams={initialCropParams}
              setCropParams={setInitialCropParams}
            />
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.chooseContrast}
            label={t("customImage.steps.contrast.stepLabel")}
          >
            <StepChooseContrast
              src={croppedImage}
              onResult={handleStepChooseContrastResult}
              onError={errorHandlers[Step.chooseContrast]}
              setStep={setStepWrapper}
            />
          </FlowStepper.Indexed.Step>
          <FlowStepper.Indexed.Step
            itemKey={Step.transferImage}
            label={t("customImage.steps.transfer.stepLabel")}
          >
            <StepTransfer
              result={finalResult}
              onError={errorHandlers[Step.transferImage]}
              setStep={setStepWrapper}
              onResult={handleStepTransferResult}
              onExit={exit}
            />
          </FlowStepper.Indexed.Step>
        </FlowStepper.Indexed>
      ) : (
        <StepContainer
          footer={
            <StepFooter
              nextLabel={t("customImage.finishCTA")}
              setStep={setStepWrapper}
              onClickNext={handleDone}
              nextTestId="custom-image-finish-button"
            />
          }
        >
          <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center">
            <BoxedIcon
              size={64}
              iconSize={24}
              Icon={Icons.CheckAloneMedium}
              iconColor="success.c50"
            />
            <Flex flexDirection="row" flexShrink={0}>
              <Log
                extraTextProps={{
                  variant: "h5",
                }}
                mt={12}
                width={201}
              >
                {t("customImage.customImageSet")}
              </Log>
            </Flex>
          </Flex>
        </StepContainer>
      )}
    </Flex>
  );
};

export default withV3StyleProvider(CustomImage);
