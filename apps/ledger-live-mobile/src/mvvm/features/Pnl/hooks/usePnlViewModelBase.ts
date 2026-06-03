import { useCallback, useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { buildUnrealisedReturnCard } from "../builders/buildUnrealisedReturnCard";
import { buildSecondaryCard } from "../builders/buildSecondaryCard";
import { buildPnlDetail } from "../builders/buildPnlDetail";
import type { PnlNamespace, PnlNumbers, PnlSecondaryCardConfig, PnlViewModel } from "../types";
import {
  PNL_BUTTON,
  PNL_DETAIL_PAGE,
  AVERAGE_PRICE_PAGE,
  AVERAGE_PRICE_EVENT,
  AVERAGE_PRICE_BUTTON,
  AVERAGE_PRICE_TYPE,
} from "../const";
import { track } from "~/analytics";

const ZERO = new BigNumber(0);

type Drawer = "pnl" | "secondary" | null;

export type UsePnlViewModelBaseInput = {
  namespace: PnlNamespace;
  pnlData: PnlNumbers | null;
  secondaryCard: PnlSecondaryCardConfig;
  accountsCount: number;
  source?: string;
};

export function usePnlViewModelBase({
  namespace,
  pnlData,
  secondaryCard,
  accountsCount,
  source,
}: UsePnlViewModelBaseInput): PnlViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("mobile");
  const fiat = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const [openDrawer, setOpenDrawer] = useState<Drawer>(null);

  const { unrealisedPnL = ZERO, realisedPnL = ZERO, totalPnL = ZERO } = pnlData ?? {};

  const formatFiat = useCallback(
    (value: BigNumber, alwaysShowSign?: boolean) =>
      formatCurrencyUnit(fiat.units[0], value, {
        showCode: true,
        locale,
        discreet,
        alwaysShowSign,
      }),
    [fiat, locale, discreet],
  );

  const openPnlDrawer = useCallback(() => setOpenDrawer("pnl"), []);
  const openSecondaryDrawer = useCallback(() => setOpenDrawer("secondary"), []);
  const closeDrawer = useCallback(() => setOpenDrawer(null), []);

  const drawerOpenGuardRef = useRef(false);

  const handleCloseDrawer = useCallback(() => {
    drawerOpenGuardRef.current = false;
    closeDrawer();
  }, [closeDrawer]);

  const handleOpenPnlDrawer = useCallback(() => {
    if (drawerOpenGuardRef.current) return;
    drawerOpenGuardRef.current = true;
    track("button_clicked", { button: PNL_BUTTON, page: source });
    openPnlDrawer();
  }, [openPnlDrawer, source]);

  const handleOpenSecondaryDrawer = useCallback(() => {
    if (drawerOpenGuardRef.current) return;
    drawerOpenGuardRef.current = true;
    track(AVERAGE_PRICE_EVENT, {
      button: AVERAGE_PRICE_BUTTON,
      page: source,
      type: AVERAGE_PRICE_TYPE,
    });
    openSecondaryDrawer();
  }, [openSecondaryDrawer, source]);

  const unrealised = useMemo(
    () =>
      buildUnrealisedReturnCard({
        namespace,
        unrealisedPnL,
        formatFiat,
        onPress: handleOpenPnlDrawer,
        t,
      }),
    [namespace, unrealisedPnL, formatFiat, handleOpenPnlDrawer, t],
  );

  const secondary = useMemo(
    () =>
      buildSecondaryCard({
        ...secondaryCard,
        formatFiat,
        onPress: handleOpenSecondaryDrawer,
        t,
      }),
    [secondaryCard, formatFiat, handleOpenSecondaryDrawer, t],
  );

  const detail = useMemo(
    () => buildPnlDetail({ namespace, totalPnL, unrealisedPnL, realisedPnL, formatFiat, t }),
    [namespace, totalPnL, unrealisedPnL, realisedPnL, formatFiat, t],
  );

  return {
    shouldDisplayPnl: isPnlFlagOn && accountsCount > 0,
    unrealised,
    secondary,
    pnlDrawer: {
      isOpen: openDrawer === "pnl",
      onClose: handleCloseDrawer,
      title: detail.title,
      description: detail.description,
      items: detail.items,
      footer: t("pnl.disclaimer"),
      pageName: PNL_DETAIL_PAGE,
      source,
    },
    secondaryDrawer: {
      isOpen: openDrawer === "secondary",
      onClose: handleCloseDrawer,
      title: t(secondaryCard.titleKey),
      bodyText: t(secondaryCard.tooltipKey),
      pageName: AVERAGE_PRICE_PAGE,
      source,
    },
  };
}
