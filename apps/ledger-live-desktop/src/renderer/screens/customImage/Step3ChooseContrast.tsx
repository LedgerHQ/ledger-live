import React, { useState } from "react";
import ImageGrayscalePreview from "~/renderer/components/CustomImage/ImageGrayscalePreview";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import { Step, StepProps } from "./types";
import { useTranslation } from "react-i18next";
import StepFooter from "./StepFooter";
import StepContainer from "./StepContainer";

type Props = StepProps & {
  onResult: React.ComponentProps<typeof ImageGrayscalePreview>["onResult"];
  src?: ImageBase64Data;
};

const StepChooseContrast: React.FC<Props> = props => {
  const { onResult, onError, src, setStep } = props;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  return (
    <StepContainer
      footer={
        <StepFooter
          previousStep={Step.adjustImage}
          previousLabel={t("common.previous")}
          nextStep={Step.transferImage}
          nextLabel={t("common.continue")}
          nextLoading={loading}
          nextDisabled={loading}
          previousTestId="custom-image-contrast-previous-button"
          nextTestId="custom-image-contrast-continue-button"
          setStep={setStep}
        />
      }
    >
      {src ? (
        <ImageGrayscalePreview
          {...src}
          onResult={onResult}
          onError={onError}
          setLoading={setLoading}
        />
      ) : null}
    </StepContainer>
  );
};

export default StepChooseContrast;
