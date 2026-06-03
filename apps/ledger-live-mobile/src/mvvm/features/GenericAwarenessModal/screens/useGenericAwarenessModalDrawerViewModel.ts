import { useCallback, useEffect, useMemo, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@features/platform-feature-flags";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { useDispatch, useSelector } from "~/context/hooks";
import { setDismissedContentCard } from "~/actions/settings";
import {
  closeGenericAwarenessModalDrawer,
  markGenericAwarenessModalContentCardAsRead,
  openGenericAwarenessModalDrawer,
  selectGenericAwarenessModalCampaignId,
  selectGenericAwarenessModalContentCards,
  selectCurrentGenericAwarenessModalContentCard,
  selectIsGenericAwarenessModalOpen,
} from "~/reducers/genericAwarenessModal";
import { useGenericAwarenessModalLogic } from "./useGenericAwarenessModalLogic";
import {
  trackGenericAwarenessModalButtonClicked,
  trackGenericAwarenessModalCarouselStepViewed,
  trackGenericAwarenessModalDismissed,
  trackGenericAwarenessModalFeatureIntroViewed,
  trackGenericAwarenessModalMalformedUrl,
  trackGenericAwarenessModalPromptViewed,
  trackGenericAwarenessModalTourCompleted,
} from "../analytics";

export type FeatureIntroViewModel = Readonly<{
  content: GenericAwarenessModalFeatureIntro;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
}>;

export type CarouselViewModel = Readonly<{
  content: GenericAwarenessModalCarousel;
  getCurrentSlideIndex: () => number;
  onSlideViewed: (slideIndex: number, isLastSlide: boolean) => void;
  onNavigationPress: (slideIndex: number, button: string, isLastSlide: boolean) => void;
  onPrimaryPress: (slideIndex: number) => void;
  onMalformedUrl: (slideIndex: number) => void;
}>;

export type PromptViewModel = Readonly<{
  content: GenericAwarenessModalPrompt;
  onClosePress: () => void;
  onPrimaryPress: () => void;
  onMalformedUrl: () => void;
}>;

function useFeatureIntroViewModel(
  data: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): FeatureIntroViewModel | undefined {
  const displayedFeatureIntroIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      displayedFeatureIntroIdRef.current = undefined;
      return;
    }

    if (
      data?.layout === GenericAwarenessModalLayout.FeatureIntro &&
      displayedFeatureIntroIdRef.current !== data.id
    ) {
      displayedFeatureIntroIdRef.current = data.id;
      trackGenericAwarenessModalFeatureIntroViewed(data);
    }
  }, [data, isOpen]);

  const onPrimaryPress = useCallback(() => {
    if (data?.layout !== GenericAwarenessModalLayout.FeatureIntro) {
      return;
    }

    trackGenericAwarenessModalButtonClicked(data, data.primaryButtonLabel, {
      ctaPosition: "primary",
      link: data.primaryButtonLink,
    });
  }, [data]);

  const onSecondaryPress = useCallback(() => {
    if (data?.layout !== GenericAwarenessModalLayout.FeatureIntro) {
      return;
    }

    trackGenericAwarenessModalButtonClicked(data, data.secondaryButtonLabel, {
      ctaPosition: "secondary",
      link: data.secondaryButtonLink,
    });
  }, [data]);

  return useMemo(() => {
    if (data?.layout !== GenericAwarenessModalLayout.FeatureIntro) {
      return undefined;
    }

    return {
      content: data,
      onPrimaryPress,
      onSecondaryPress,
    };
  }, [data, onPrimaryPress, onSecondaryPress]);
}

function useCarouselViewModel(
  data: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): CarouselViewModel | undefined {
  const currentSlideIndexRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      currentSlideIndexRef.current = 0;
    }
  }, [isOpen]);

  const getCurrentSlideIndex = useCallback(() => currentSlideIndexRef.current, []);

  const onSlideViewed = useCallback(
    (slideIndex: number, isLastSlide: boolean) => {
      if (data?.layout !== GenericAwarenessModalLayout.Carousel) {
        return;
      }

      currentSlideIndexRef.current = slideIndex;
      trackGenericAwarenessModalCarouselStepViewed(data, slideIndex);

      if (isLastSlide) {
        trackGenericAwarenessModalTourCompleted(data, slideIndex);
      }
    },
    [data],
  );

  const onNavigationPress = useCallback(
    (slideIndex: number, button: string) => {
      if (data?.layout !== GenericAwarenessModalLayout.Carousel) {
        return;
      }

      trackGenericAwarenessModalButtonClicked(data, button, {
        ctaPosition: "primary",
        slideIndex,
      });
    },
    [data],
  );

  const onPrimaryPress = useCallback(
    (slideIndex: number) => {
      if (data?.layout !== GenericAwarenessModalLayout.Carousel) {
        return;
      }

      const slide = data.data[slideIndex];
      if (!slide) {
        return;
      }

      trackGenericAwarenessModalButtonClicked(data, slide.primaryButtonLabel, {
        ctaPosition: "secondary",
        slideIndex,
        link: slide.primaryButtonLink,
      });
    },
    [data],
  );

  const onMalformedUrl = useCallback(
    (slideIndex: number) => {
      if (data?.layout !== GenericAwarenessModalLayout.Carousel) {
        return;
      }

      trackGenericAwarenessModalMalformedUrl(data, slideIndex);
    },
    [data],
  );

  return useMemo(() => {
    if (data?.layout !== GenericAwarenessModalLayout.Carousel) {
      return undefined;
    }

    return {
      content: data,
      getCurrentSlideIndex,
      onSlideViewed,
      onNavigationPress,
      onPrimaryPress,
      onMalformedUrl,
    };
  }, [
    data,
    getCurrentSlideIndex,
    onMalformedUrl,
    onNavigationPress,
    onPrimaryPress,
    onSlideViewed,
  ]);
}

function usePromptViewModel(
  data: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): PromptViewModel | undefined {
  const displayedPromptIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      displayedPromptIdRef.current = undefined;
      return;
    }

    if (
      data?.layout === GenericAwarenessModalLayout.Prompt &&
      displayedPromptIdRef.current !== data.id
    ) {
      displayedPromptIdRef.current = data.id;
      trackGenericAwarenessModalPromptViewed(data);
    }
  }, [data, isOpen]);

  const onClosePress = useCallback(() => {
    if (data?.layout !== GenericAwarenessModalLayout.Prompt) {
      return;
    }

    trackGenericAwarenessModalButtonClicked(data, "Close", {
      ctaPosition: "primary",
    });
  }, [data]);

  const onPrimaryPress = useCallback(() => {
    if (data?.layout !== GenericAwarenessModalLayout.Prompt) {
      return;
    }

    trackGenericAwarenessModalButtonClicked(data, data.primaryButtonLabel, {
      ctaPosition: "secondary",
      link: data.primaryButtonLink,
    });
  }, [data]);

  const onMalformedUrl = useCallback(() => {
    if (data?.layout !== GenericAwarenessModalLayout.Prompt) {
      return;
    }

    trackGenericAwarenessModalMalformedUrl(data);
  }, [data]);

  return useMemo(() => {
    if (data?.layout !== GenericAwarenessModalLayout.Prompt) {
      return undefined;
    }

    return {
      content: data,
      onClosePress,
      onPrimaryPress,
      onMalformedUrl,
    };
  }, [data, onClosePress, onMalformedUrl, onPrimaryPress]);
}

export function useGenericAwarenessModalDrawerViewModel() {
  const dispatch = useDispatch();
  const isPortfolioFocused = useIsFocused();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const genericAwarenessModalFlag = useFeature("lwmGenericAwarenessModal");
  const isOpen = useSelector(selectIsGenericAwarenessModalOpen);
  const campaignId = useSelector(selectGenericAwarenessModalCampaignId);
  const cards = useSelector(selectGenericAwarenessModalContentCards);
  const data = useSelector(selectCurrentGenericAwarenessModalContentCard);

  const open = useCallback(
    (campaignId: string) => {
      dispatch(openGenericAwarenessModalDrawer({ campaignId }));
    },
    [dispatch],
  );

  const { shouldMarkAsRead } = useGenericAwarenessModalLogic(
    { campaignId, cards },
    {
      enabled: genericAwarenessModalFlag?.enabled ?? false,
      isFocused: isPortfolioFocused,
      isOpen,
      open,
    },
  );

  const featureIntroViewModel = useFeatureIntroViewModel(data, isOpen);
  const carouselViewModel = useCarouselViewModel(data, isOpen);
  const promptViewModel = usePromptViewModel(data, isOpen);

  const onClose = useCallback(() => {
    if (data) {
      trackGenericAwarenessModalDismissed(data, carouselViewModel?.getCurrentSlideIndex());
    }

    if (data && shouldMarkAsRead) {
      dispatch(setDismissedContentCard({ [data.id]: Date.now() }));
      dispatch(markGenericAwarenessModalContentCardAsRead({ id: data.id }));
    }

    dispatch(closeGenericAwarenessModalDrawer());
  }, [carouselViewModel, data, dispatch, shouldMarkAsRead]);

  return {
    isOpen,
    data,
    bottomInset: bottomInset + 20,
    onClose,
    featureIntroViewModel,
    carouselViewModel,
    promptViewModel,
  };
}
