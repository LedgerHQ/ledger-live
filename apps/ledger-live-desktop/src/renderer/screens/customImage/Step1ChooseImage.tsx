import React from "react";
import { ImageBase64Data } from "~/renderer/components/CustomImage/types";
import ImportImage from "~/renderer/components/CustomImage/ImportImage";
import { StepProps } from "./types";
import StepContainer from "./StepContainer";

type Props = StepProps & {
  onResult: (res: ImageBase64Data) => void;
  setLoading: (_: boolean) => void;
};

const StepChooseImage: React.FC<Props> = props => {
  const { setLoading, onResult, onError } = props;
  return (
    <StepContainer>
      <ImportImage setLoading={setLoading} onResult={onResult} onError={onError} />
    </StepContainer>
  );
};

export default StepChooseImage;
