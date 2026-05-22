import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { closeGenericAwarenessModalDialog } from "./genericAwarenessModalDialog";
import type { AwarenessCarouselSlide } from "./components/CarouselContent";
import { openURL } from "~/renderer/linking";

const CAROUSEL_SLIDES: AwarenessCarouselSlide[] = [
  {
    id: "overview",
    title: "Your portfolio at a glance",
    subtitle: "See balances and accounts in one secure dashboard.",
    imageUrl: "https://placehold.co/600x400/orange/white",
    primaryButtonLabel: "Learn more",
    primaryButtonLink: "https://www.ledger.com",
  },
  {
    id: "security",
    title: "Keys never leave your device",
    subtitle: "Transactions are verified on your Ledger hardware.",
    imageUrl: "https://placehold.co/600x400/lightgreen/white",
    primaryButtonLabel: "Why Ledger",
    primaryButtonLink: "https://www.ledger.com/academy",
  },
  {
    id: "next-steps",
    title: "Connect when you are ready",
    subtitle: "Plug in your Ledger to send, swap, and receive with confidence.",
    imageUrl: "https://placehold.co/600x400/png",
    primaryButtonLabel: "Get support",
    primaryButtonLink: "https://support.ledger.com",
  },
];

export interface GenericAwarenessModalCarouselViewModel {
  slides: AwarenessCarouselSlide[];
  onSlidePrimaryClick: (slide: AwarenessCarouselSlide) => void;
}

const useGenericAwarenessModalCarouselViewModel = (): GenericAwarenessModalCarouselViewModel => {
  const dispatch = useDispatch();

  const onSlidePrimaryClick = useCallback(
    (slide: AwarenessCarouselSlide) => {
      openURL(slide.primaryButtonLink);
      dispatch(closeGenericAwarenessModalDialog());
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      slides: CAROUSEL_SLIDES,
      onSlidePrimaryClick,
    }),
    [onSlidePrimaryClick],
  );
};

export default useGenericAwarenessModalCarouselViewModel;
