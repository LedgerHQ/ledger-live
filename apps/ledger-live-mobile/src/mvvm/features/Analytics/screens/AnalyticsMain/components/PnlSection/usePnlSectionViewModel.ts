import { useCallback, useMemo, useState, useRef } from "react";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { useCountervaluesState } from "~/reducers/countervalues";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { buildReturnCard } from "LLM/features/Pnl/builders/buildReturnCard";
import { buildPnlDetail } from "LLM/features/Pnl/builders/buildPnlDetail";
import { PNL_BUTTON, PNL_DETAIL_PAGE } from "LLM/features/Pnl/const";
import type { PnlSectionViewModel } from "./types";
import { track } from "~/analytics";
import { ANALYTICS_PAGE } from "../../../../const";

const ZERO = new BigNumber(0);
const EMPTY_ACCOUNTS: Parameters<typeof usePortfolioPnL>[0] = [];

export function usePnlSectionViewModel(): PnlSectionViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("mobile");
  const accounts = useSelector(shallowAccountsSelector);
  const countervalues = useCountervaluesState();
  const fiat = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);

  // Skip the (potentially expensive) portfolio walk when the section is hidden.
  const pnl = usePortfolioPnL(isPnlFlagOn ? accounts : EMPTY_ACCOUNTS, countervalues, fiat);
  const { unrealisedPnL = ZERO, realisedPnL = ZERO, totalPnL = ZERO } = pnl ?? {};

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const drawerOpenGuardRef = useRef(false);

  const handleCloseDrawer = useCallback(() => {
    drawerOpenGuardRef.current = false;
    closeDrawer();
  }, [closeDrawer]);

  const handleOpenDrawer = useCallback(() => {
    if (drawerOpenGuardRef.current) return;
    drawerOpenGuardRef.current = true;
    openDrawer();
    track("button_clicked", {
      button: PNL_BUTTON,
      page: ANALYTICS_PAGE,
    });
  }, [openDrawer]);

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

  const unrealised = useMemo(
    () =>
      buildReturnCard({
        titleKey: "pnl.portfolio.return.title",
        amount: unrealisedPnL,
        formatFiat,
        t,
      }),
    [unrealisedPnL, formatFiat, t],
  );

  const realised = useMemo(
    () =>
      buildReturnCard({
        titleKey: "pnl.portfolio.realised.title",
        amount: realisedPnL,
        formatFiat,
        t,
      }),
    [realisedPnL, formatFiat, t],
  );

  const detail = useMemo(
    () =>
      buildPnlDetail({
        namespace: "pnl.portfolio",
        totalPnL,
        unrealisedPnL,
        realisedPnL,
        formatFiat,
        t,
      }),
    [totalPnL, unrealisedPnL, realisedPnL, formatFiat, t],
  );

  return {
    shouldDisplayPnl: isPnlFlagOn && accounts.length > 0,
    title: t("pnl.portfolio.title"),
    unrealised,
    realised,
    openDrawer: handleOpenDrawer,
    drawer: {
      isOpen: isDrawerOpen,
      onClose: handleCloseDrawer,
      title: detail.title,
      description: detail.description,
      items: detail.items,
      footer: t("pnl.disclaimer"),
      pageName: PNL_DETAIL_PAGE,
      source: ANALYTICS_PAGE,
    },
  };
}
