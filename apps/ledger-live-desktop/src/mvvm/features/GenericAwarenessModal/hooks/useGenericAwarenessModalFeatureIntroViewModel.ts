import { useCallback, useEffect, useMemo, useRef } from "react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import { useDispatch } from "LLD/hooks/redux";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { openURL } from "~/renderer/linking";
import {
  closeGenericAwarenessModalDialog,
  type CloseGenericAwarenessModalDialogOptions,
} from "../genericAwarenessModalDialog";
import {
  getFeatureIntroAnalyticsContext,
  trackFeatureIntroCloseClick,
  trackFeatureIntroDismissed,
  trackFeatureIntroPage,
  trackFeatureIntroPrimaryClick,
  trackFeatureIntroSecondaryClick,
} from "../analytics/featureIntroAnalytics";
import type { FeatureIntroContentItem, LumenSymbolName } from "../components/FeatureIntroContent";

export interface GenericAwarenessModalFeatureIntroViewModel {
  title: string;
  subtitle: string;
  items: FeatureIntroContentItem[];
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  imageUrlLight?: string;
  imageUrlDark?: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  onHeaderClose: () => void;
  onDismiss: () => void;
}

// hasOwn checks only exported symbol keys; `in` would also match Object.prototype names (e.g. "toString").
const isLumenSymbolName = (icon: string): icon is LumenSymbolName => Object.hasOwn(Icons, icon);

const mapFeatureIntroItems = (
  featureIntro: GenericAwarenessModalFeatureIntro,
): FeatureIntroContentItem[] =>
  featureIntro.items.map(item => ({
    title: item.title,
    subtitle: item.subtitle,
    icon: isLumenSymbolName(item.icon) ? item.icon : "LedgerLogo",
  }));

const useGenericAwarenessModalFeatureIntroViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalFeatureIntroViewModel => {
  const dispatch = useDispatch();
  const hasTrackedOpenRef = useRef(false);

  const featureIntro: GenericAwarenessModalFeatureIntro | undefined =
    contentCard?.layout === GenericAwarenessModalLayout.FeatureIntro ? contentCard : undefined;

  const closeDialog = useCallback(
    (options?: CloseGenericAwarenessModalDialogOptions) => {
      dispatch(closeGenericAwarenessModalDialog(options));
    },
    [dispatch],
  );

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
      trackFeatureIntroPrimaryClick(
        context,
        featureIntro.primaryButtonLabel,
        featureIntro.primaryButtonLink,
      );
      openURL(featureIntro.primaryButtonLink);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, featureIntro, getContext]);

  const onSecondaryClick = useCallback(() => {
    const context = getContext();
    if (context && featureIntro) {
      trackFeatureIntroSecondaryClick(
        context,
        featureIntro.secondaryButtonLabel,
        featureIntro.secondaryButtonLink,
      );
      openURL(featureIntro.secondaryButtonLink);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, featureIntro, getContext]);

  const onHeaderClose = useCallback(() => {
    const context = getContext();
    if (context) {
      trackFeatureIntroCloseClick(context);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext]);

  const onDismiss = useCallback(() => {
    const context = getContext();
    if (context) {
      trackFeatureIntroDismissed(context);
    }
    closeDialog({ dismissAppStart: true });
  }, [closeDialog, getContext]);

  return useMemo(
    () => ({
      title: featureIntro?.title ?? "",
      subtitle: featureIntro?.subtitle ?? "",
      items: featureIntro ? mapFeatureIntroItems(featureIntro) : [],
      primaryButtonLabel: featureIntro?.primaryButtonLabel ?? "",
      primaryButtonLink: featureIntro?.primaryButtonLink ?? "",
      secondaryButtonLabel: featureIntro?.secondaryButtonLabel ?? "",
      secondaryButtonLink: featureIntro?.secondaryButtonLink ?? "",
      imageUrlLight: featureIntro?.imageUrlLight,
      imageUrlDark: featureIntro?.imageUrlDark,
      onPrimaryClick,
      onSecondaryClick,
      onHeaderClose,
      onDismiss,
    }),
    [featureIntro, onDismiss, onHeaderClose, onPrimaryClick, onSecondaryClick],
  );
};

export default useGenericAwarenessModalFeatureIntroViewModel;
