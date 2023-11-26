import React, { useMemo, useState } from "react";
import ImageGrayscalePreview from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { Step, StepProps } from "./types";
import { useTranslation } from "react-i18next";
import StepFooter from "./StepFooter";
import StepContainer from "./StepContainer";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName, analyticsPageNames } from "./shared";

type Props = StepProps & {
  onResult: React.ComponentProps<typeof ImageGrayscalePreview>["onResult"];
  src?: ImageBase64Data;
};

const previousButtonEventProperties = {
  button: "Back",
};

const StepChooseContrast: React.FC<Props> = props => {
  const { onResult, onError, src, setStep } = props;
  const { t } = useTranslation();

  const [contrast, setContrast] = useState<{ index: number; value: number }>();
  const [loading, setLoading] = useState(true);

  const nextButtonEventProperties = useMemo(
    () => ({
      button: "Confirm contrast",
      ...(contrast ? { contrast: contrast.value } : {}),
    }),
    [contrast],
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
        <ImageGrayscalePreview
          {...src}
          onResult={onResult}
          onError={onError}
          setLoading={setLoading}
          onContrastChanged={setContrast}
        />
      ) : null}
    </StepContainer>
  );
};

export default StepChooseContrast;
