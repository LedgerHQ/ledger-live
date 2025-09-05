import React, { useMemo, useState } from "react";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import ImageDithering from "~/renderer/components/CustomImage/ImageDithering";
import { DitheringAlgorithm } from "~/renderer/components/CustomImage/dithering/types";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { Step, StepProps } from "./types";
import { useTranslation } from "react-i18next";
import StepFooter from "./StepFooter";
import StepContainer from "./StepContainer";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName, analyticsPageNames } from "./shared";

type Props = StepProps & {
  onResult: React.ComponentProps<typeof ImageDithering>["onResult"];
  src?: ImageBase64Data;
  deviceModelId: CLSSupportedDeviceModelId;
};

const previousButtonEventProperties = {
  button: "Back",
};

const StepChooseContrast: React.FC<Props> = props => {
  const { onResult, onError, src, setStep, deviceModelId } = props;
  const { t } = useTranslation();

  const [ditheringConfig, setDitheringConfig] = useState<{
    index: number;
    contrastValue: number;
    ditheringAlgorithm: DitheringAlgorithm;
  }>();
  const [loading, setLoading] = useState(true);

  const nextButtonEventProperties = useMemo(
    () => ({
      button: "Confirm contrast",
      ...(ditheringConfig
        ? {
            contrast: ditheringConfig.contrastValue,
            ditheringAlgorithm: ditheringConfig.ditheringAlgorithm,
          }
        : {}),
    }),
    [ditheringConfig],
  );

  return (
    <StepContainer
      footer={
        <StepFooter
          previousStep={Step.adjustImage}
          previousLabel={t("common.back")}
          nextStep={Step.transferImage}
          nextLabel={t("customImage.steps.contrast.confirmContrast")}
          nextLoading={loading}
          nextDisabled={loading}
          previousTestId="custom-image-contrast-previous-button"
          nextTestId="custom-image-contrast-continue-button"
          setStep={setStep}
          previousEventProperties={previousButtonEventProperties}
          nextEventProperties={nextButtonEventProperties}
        />
      }
    >
      <TrackPage
        category={analyticsPageNames.chooseContrast}
        type="drawer"
        flow={analyticsFlowName}
        refreshSource={false}
      />
      {src ? (
        <ImageDithering
          {...src}
          deviceModelId={deviceModelId}
          onResult={onResult}
          onError={onError}
          setLoading={setLoading}
          onDitheringConfigChanged={setDitheringConfig}
        />
      ) : null}
    </StepContainer>
  );
};

export default StepChooseContrast;
