import { useMemo } from "react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type {
  FeatureIntroContentItem,
  LumenSymbolName,
} from "../components/FeatureIntroContent";
import type { AwarenessModalDismissMethod } from "../analytics/const";
import useGenericAwarenessModalFeatureIntroAnalytics from "./useGenericAwarenessModalFeatureIntroAnalytics";

export interface GenericAwarenessModalFeatureIntroViewModel {
  title: string;
  subtitle: string;
  items: FeatureIntroContentItem[];
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  imageUrl?: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  onHeaderClose: () => void;
  onDismiss: (dismissMethod: AwarenessModalDismissMethod) => void;
}

// hasOwn checks only exported symbol keys; `in` would also match Object.prototype names (e.g. "toString").
const isLumenSymbolName = (icon: string): icon is LumenSymbolName => Object.hasOwn(Icons, icon);

const mapFeatureIntroItems = (
  featureIntro: GenericAwarenessModalFeatureIntro,
): FeatureIntroContentItem[] =>
  featureIntro.items.map(item => ({
    title: item.title,
    subtitle: item.subtitle,
    icon: isLumenSymbolName(item.icon) ? item.icon : "Gift",
  }));

const useGenericAwarenessModalFeatureIntroViewModel = (
  contentCard: GenericAwarenessModalContentCard | undefined,
  isOpen: boolean,
): GenericAwarenessModalFeatureIntroViewModel => {
  const featureIntro =
    contentCard?.layout === GenericAwarenessModalLayout.FeatureIntro ? contentCard : undefined;

  const analytics = useGenericAwarenessModalFeatureIntroAnalytics(contentCard, isOpen);

  return useMemo(
    () => ({
      title: featureIntro?.title ?? "",
      subtitle: featureIntro?.subtitle ?? "",
      items: featureIntro ? mapFeatureIntroItems(featureIntro) : [],
      primaryButtonLabel: featureIntro?.primaryButtonLabel ?? "",
      secondaryButtonLabel: featureIntro?.secondaryButtonLabel ?? "",
      imageUrl: featureIntro?.imageUrl || undefined,
      onPrimaryClick: analytics.onPrimaryClick,
      onSecondaryClick: analytics.onSecondaryClick,
      onHeaderClose: analytics.onHeaderClose,
      onDismiss: analytics.onDismiss,
    }),
    [analytics, featureIntro],
  );
};

export default useGenericAwarenessModalFeatureIntroViewModel;
