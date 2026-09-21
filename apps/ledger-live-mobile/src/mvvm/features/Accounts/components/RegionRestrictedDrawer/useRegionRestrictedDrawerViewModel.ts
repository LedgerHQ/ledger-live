import { useCallback } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import {
  closeCurrencyRegionRestrictedDrawer,
  selectCurrencyRegionRestrictedDrawerCurrencyName,
  selectIsCurrencyRegionRestrictedDrawerOpen,
} from "~/reducers/currencyRegionRestrictedDrawer";

export interface RegionRestrictedDrawerViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  learnMoreLabel: string;
  closeLabel: string;
  onLearnMore: () => void;
  onPressClose: () => void;
  onDismiss: () => void;
}

const DRAWER_NAME = "RegionRestricted";

export function useRegionRestrictedDrawerViewModel(): RegionRestrictedDrawerViewProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCurrencyRegionRestrictedDrawerOpen);
  const currencyName = useSelector(selectCurrencyRegionRestrictedDrawerCurrencyName) ?? "";
  const learnMoreUrl = useLocalizedUrl(urls.errors.AddressesSanctionedError);

  const onDismiss = useCallback(() => {
    dispatch(closeCurrencyRegionRestrictedDrawer());
  }, [dispatch]);

  const onLearnMore = useCallback(() => {
    track("button_clicked", { button: "Learn more", drawer: DRAWER_NAME });
    Linking.openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  const onPressClose = useCallback(() => {
    track("button_clicked", { button: "Close", drawer: DRAWER_NAME });
    onDismiss();
  }, [onDismiss]);

  return {
    isOpen,
    title: t("errors.CurrencyRegionRestrictedError.title", { currencyName }),
    description: t("errors.CurrencyRegionRestrictedError.description", { currencyName }),
    learnMoreLabel: t("common.learnMore"),
    closeLabel: t("common.close"),
    onLearnMore,
    onPressClose,
    onDismiss,
  };
}
