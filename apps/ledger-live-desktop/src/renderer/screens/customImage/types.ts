export enum Step {
  chooseImage = "chooseImage",
  adjustImage = "adjustImage",
  chooseContrast = "chooseContrast",
  transferImage = "transferImage",
}

export type StepProps = {
  onError: (error: Error) => void;
  setStep: (step: Step) => void;
};
