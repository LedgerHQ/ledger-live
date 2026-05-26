import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "../genericAwarenessModalDialog";
import {
  getFeatureIntroAnalyticsContext,
  trackFeatureIntroCloseClick,
  trackFeatureIntroDismissed,
  trackFeatureIntroPage,
  trackFeatureIntroPrimaryClick,
  trackFeatureIntroSecondaryClick,
} from "../analytics/featureIntroAnalytics";
import type { AwarenessModalDismissMethod } from "../analytics/const";

export interface GenericAwarenessModalFeatureIntroAnalyticsHandlers {
  readonly onPrimaryClick: () => void;
  readonly onSecondaryClick: () => void;
  readonly onHeaderClose: () => void;
  readonly onDismiss: (dismissMethod: AwarenessModalDismissMethod) => void;
}

const useGenericAwarenessModalFeatureIntroAnalytics = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalFeatureIntroAnalyticsHandlers => {
  const dispatch = useDispatch();
  const hasTrackedOpenRef = useRef(false);

  const featureIntro: GenericAwarenessModalFeatureIntro | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.FeatureIntro ? contentCard : undefined;

  const closeDialog = useCallback(() => {
    dispatch(closeGenericAwarenessModalDialog());
  }, [dispatch]);

  const getContext = useCallback(() => {
    if (!featureIntro) {
      return undefined;
    }
    return getFeatureIntroAnalyticsContext(featureIntro);
  }, [featureIntro]);

  useEffect(() => {
    if (!isOpen || !featureIntro) {
      hasTrackedOpenRef.current = false;
      return;
    }

    if (hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;
    trackFeatureIntroPage(featureIntro);
  }, [featureIntro, isOpen]);

  const onPrimaryClick = useCallback(() => {
    const context = getContext();
    if (context && featureIntro) {
      trackFeatureIntroPrimaryClick(context, featureIntro.primaryButtonLabel);
      openURL(featureIntro.primaryButtonLink);
    }
    closeDialog();
  }, [closeDialog, featureIntro, getContext]);

  const onSecondaryClick = useCallback(() => {
    const context = getContext();
    if (context && featureIntro) {
      trackFeatureIntroSecondaryClick(context, featureIntro.secondaryButtonLabel);
      openURL(featureIntro.secondaryButtonLink);
    }
    closeDialog();
  }, [closeDialog, featureIntro, getContext]);

  const onHeaderClose = useCallback(() => {
    const context = getContext();
    if (context) {
      trackFeatureIntroCloseClick(context);
    }
    closeDialog();
  }, [closeDialog, getContext]);

  const onDismiss = useCallback(
    (dismissMethod: AwarenessModalDismissMethod) => {
      const context = getContext();
      if (context) {
        trackFeatureIntroDismissed(context, dismissMethod);
      }
      closeDialog();
    },
    [closeDialog, getContext],
  );

  return {
    onPrimaryClick,
    onSecondaryClick,
    onHeaderClose,
    onDismiss,
  };
};

export default useGenericAwarenessModalFeatureIntroAnalytics;
