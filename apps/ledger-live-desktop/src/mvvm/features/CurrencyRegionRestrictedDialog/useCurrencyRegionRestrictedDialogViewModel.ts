import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { track } from "~/renderer/analytics/segment";
import {
  closeCurrencyRegionRestrictedDialog,
  selectCurrencyRegionRestrictedDialogParams,
  selectIsCurrencyRegionRestrictedDialogOpen,
} from "./currencyRegionRestrictedDialog";

export interface CurrencyRegionRestrictedDialogViewProps {
  isOpen: boolean;
  title: string;
  description: string;
  learnMoreLabel: string;
  closeLabel: string;
  onClose: () => void;
  onLearnMore: () => void;
}

const PAGE_NAME = "Currency region restricted";

const useCurrencyRegionRestrictedDialogViewModel = (): CurrencyRegionRestrictedDialogViewProps => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCurrencyRegionRestrictedDialogOpen);
  const params = useSelector(selectCurrencyRegionRestrictedDialogParams);
  const learnMoreUrl = useLocalizedUrl(urls.geoBlock.learnMore);
  const currencyName = params?.currencyName ?? "";

  const onClose = useCallback(() => {
    track("button_clicked", { button: "Close", page: PAGE_NAME });
    dispatch(closeCurrencyRegionRestrictedDialog());
  }, [dispatch]);

  const onLearnMore = useCallback(() => {
    track("button_clicked", { button: "Learn more", page: PAGE_NAME });
    openURL(learnMoreUrl);
  }, [learnMoreUrl]);

  return {
    isOpen,
    title: t("errors.CurrencyRegionRestrictedError.title", { currencyName }),
    description: t("errors.CurrencyRegionRestrictedError.description", { currencyName }),
    learnMoreLabel: t("common.learnMore"),
    closeLabel: t("common.close"),
    onClose,
    onLearnMore,
  };
};

export default useCurrencyRegionRestrictedDialogViewModel;
