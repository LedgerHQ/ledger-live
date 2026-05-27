import { useCallback, useMemo } from "react";
import { useDispatch } from "LLD/hooks/redux";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import { closeGenericAwarenessModalDialog } from "../genericAwarenessModalDialog";
import type {
  FeatureIntroContentItem,
  LumenSymbolName,
} from "../components/FeatureIntroContent";
import { openURL } from "~/renderer/linking";

export interface GenericAwarenessModalFeatureIntroViewModel {
  title: string;
  subtitle: string;
  items: FeatureIntroContentItem[];
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  imageUrl?: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
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
): GenericAwarenessModalFeatureIntroViewModel => {
  const dispatch = useDispatch();

  const featureIntro =
    contentCard?.layout === GenericAwarenessModalLayout.FeatureIntro ? contentCard : undefined;

  const onPrimaryClick = useCallback(() => {
    if (featureIntro) {
      openURL(featureIntro.primaryButtonLink);
      dispatch(closeGenericAwarenessModalDialog());
    }
  }, [dispatch, featureIntro]);

  const onSecondaryClick = useCallback(() => {
    if (featureIntro) {
      openURL(featureIntro.secondaryButtonLink);
      dispatch(closeGenericAwarenessModalDialog());
    }
  }, [dispatch, featureIntro]);

  return useMemo(
    () => ({
      title: featureIntro?.title ?? "",
      subtitle: featureIntro?.subtitle ?? "",
      items: featureIntro ? mapFeatureIntroItems(featureIntro) : [],
      primaryButtonLabel: featureIntro?.primaryButtonLabel ?? "",
      secondaryButtonLabel: featureIntro?.secondaryButtonLabel ?? "",
      imageUrl: featureIntro?.imageUrl || undefined,
      onPrimaryClick,
      onSecondaryClick,
    }),
    [featureIntro, onPrimaryClick, onSecondaryClick],
  );
};

export default useGenericAwarenessModalFeatureIntroViewModel;
