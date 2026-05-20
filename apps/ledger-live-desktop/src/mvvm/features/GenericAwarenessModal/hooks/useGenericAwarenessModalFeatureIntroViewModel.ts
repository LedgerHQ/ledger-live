import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { closeGenericAwarenessModalDialog } from "../genericAwarenessModalDialog";
import type { FeatureIntroContentItem } from "../components/FeatureIntroContent";
import { openURL } from "~/renderer/linking";

const FEATURE_INTRO_ITEMS: FeatureIntroContentItem[] = [
  {
    id: "swap",
    title: "Swap and bridge",
    description: "Move assets across networks from one place.",
    iconName: "HandCoins",
  },
  {
    id: "send",
    title: "Send and receive",
    description: "Share addresses and confirm transfers on your device.",
    iconName: "Gift",
  },
  {
    id: "control",
    title: "Stay in control",
    description: "Review every sensitive action on your Ledger screen.",
    iconName: "Github",
  },
];

export interface GenericAwarenessModalFeatureIntroViewModel {
  title: string;
  subtitle: string;
  items: FeatureIntroContentItem[];
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  imageUrl?: string;
}

const useGenericAwarenessModalFeatureIntroViewModel =
  (): GenericAwarenessModalFeatureIntroViewModel => {
    const dispatch = useDispatch();

    const onPrimaryClick = useCallback(() => {
      openURL("https://www.ledger.com");
      dispatch(closeGenericAwarenessModalDialog());
    }, [dispatch]);

    const onSecondaryClick = useCallback(() => {
      openURL("https://www.ledger.com/remind-me-later");
      dispatch(closeGenericAwarenessModalDialog());
    }, [dispatch]);

    return useMemo(
      () => ({
        title: "Connect a Ledger device",
        subtitle: "To unlock the full potential of your Ledger Wallet, connect a Ledger device.",
        items: FEATURE_INTRO_ITEMS,
        primaryButtonLabel: "Got it",
        secondaryButtonLabel: "Remind me later",
        onPrimaryClick,
        onSecondaryClick,
      }),
      [onPrimaryClick, onSecondaryClick],
    );
  };

export default useGenericAwarenessModalFeatureIntroViewModel;
