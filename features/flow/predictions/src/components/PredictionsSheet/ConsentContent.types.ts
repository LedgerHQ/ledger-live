import type { PredictionsConsentVersion } from "@features/platform-predictions";

export type ConsentContentProps = Readonly<{
  version: PredictionsConsentVersion;
  onAccept: () => void;
}>;
