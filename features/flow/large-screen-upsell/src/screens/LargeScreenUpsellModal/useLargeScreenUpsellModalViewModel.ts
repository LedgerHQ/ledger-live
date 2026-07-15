import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  recordUpsellModalDisplay,
  resetUpsellModalRetries,
} from "@domain/entity-large-screen-upsell-modal";
import { LARGE_SCREEN_UPSELL_IMAGES } from "../../assets";
import {
  useLargeScreenUpsellDecision,
  type UseLargeScreenUpsellDecisionInput,
} from "../../hooks/useLargeScreenUpsellDecision";
import {
  buildLargeScreenUpsellContent,
  type BuildLargeScreenUpsellContentInput,
  type LargeScreenUpsellVariant,
} from "../../utils/upsellContent";
import type { LargeScreenUpsellModalViewModel } from "./types";

const LARGE_SCREEN_UPSELL_MODAL_ID = "large-screen-upsell-modal";

export type UseLargeScreenUpsellModalViewModelInput = UseLargeScreenUpsellDecisionInput & {
  medium: "mobile" | "desktop";
  theme: "light" | "dark";
  variant: LargeScreenUpsellVariant;
  t: BuildLargeScreenUpsellContentInput["t"];
  openUrl: (url: string) => void;
};

export function useLargeScreenUpsellModalViewModel({
  seenNanoModelIds,
  hasSeenTouchscreenDevice,
  onboardingDate,
  now,
  medium,
  theme,
  variant,
  t,
  openUrl,
}: UseLargeScreenUpsellModalViewModelInput): LargeScreenUpsellModalViewModel {
  const dispatch = useDispatch();
  const feature = useFeature("largeScreenUpsell");
  const decision = useLargeScreenUpsellDecision({
    seenNanoModelIds,
    hasSeenTouchscreenDevice,
    onboardingDate,
    now,
  });
  const [isOpen, setIsOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  const params = feature?.params;
  const content = useMemo(() => {
    if (!params) {
      return null;
    }

    return buildLargeScreenUpsellContent({
      id: LARGE_SCREEN_UPSELL_MODAL_ID,
      variant,
      discount: params.discount,
      optedInLink: params.opted_in.link,
      optedOutLink: params.opted_out.link,
      medium,
      t,
      imageUrlLight: LARGE_SCREEN_UPSELL_IMAGES.light,
      imageUrlDark: LARGE_SCREEN_UPSELL_IMAGES.dark,
    });
  }, [medium, params, t, variant]);

  const hasContent = content !== null;

  useEffect(() => {
    if (!decision.shouldShow || !hasContent || hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    setIsOpen(true);
    dispatch(recordUpsellModalDisplay());
  }, [decision.shouldShow, dispatch, hasContent]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onCtaPress = useCallback(() => {
    const link = content?.primaryButtonLink?.trim();
    if (link) {
      openUrl(link);
    }
    dispatch(resetUpsellModalRetries());
    setIsOpen(false);
  }, [content?.primaryButtonLink, dispatch, openUrl]);

  return {
    isOpen,
    imageSrc:
      theme === "dark"
        ? (content?.imageUrlDark ?? LARGE_SCREEN_UPSELL_IMAGES.dark)
        : (content?.imageUrlLight ?? LARGE_SCREEN_UPSELL_IMAGES.light),
    title: content?.title ?? "",
    subtitle: content?.subtitle ?? "",
    primaryButtonLabel: content?.primaryButtonLabel ?? "",
    onClose,
    onCtaPress,
  };
}
