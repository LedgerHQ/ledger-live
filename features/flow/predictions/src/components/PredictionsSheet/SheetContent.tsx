import React from "react";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { acceptPredictionsStep, type ShownStep } from "../../predictionsSheetStore.internals";
import { PREDICTIONS_LEARN_MORE_URL } from "../../urls";
import { ConsentContent } from "./ConsentContent";
import { IntroContent } from "./IntroContent";
import { TermsContent } from "./TermsContent";

export function SheetContent({ shownStep }: Readonly<{ shownStep: ShownStep }>) {
  const openLink = useOpenLink();
  const learnMoreUrl = useLocalizedUrl(PREDICTIONS_LEARN_MORE_URL);
  const { key, step } = shownStep;
  const accept = () => acceptPredictionsStep(key);

  switch (step.type) {
    case "intro":
      return <IntroContent onDiscover={accept} onLearnMore={() => openLink(learnMoreUrl)} />;
    case "terms":
      return <TermsContent versions={step.versions} onAccept={accept} />;
    case "consent":
      return <ConsentContent version={step.version} onAccept={accept} />;
  }
}
