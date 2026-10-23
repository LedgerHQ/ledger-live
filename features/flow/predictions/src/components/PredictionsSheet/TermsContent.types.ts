import type { PredictionsTermsVersions } from "@features/platform-predictions";

export type TermsContentProps = Readonly<{
  versions: PredictionsTermsVersions;
  onAccept: () => void;
}>;
