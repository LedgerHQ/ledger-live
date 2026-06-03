import { useCallback } from "react";
import { Linking } from "react-native";
import { useTrack } from "~/analytics";

const CHARON_LEARN_MORE_URL = "https://shop.ledger.com/products/ledger-recovery-key";

export const useSeedCompanionStepViewModel = () => {
  const track = useTrack();

  const handleLearnMoreClick = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      page: "Charon Start",
      flow: "onboarding",
    });
    Linking.openURL(CHARON_LEARN_MORE_URL);
  }, [track]);

  return { handleLearnMoreClick };
};
