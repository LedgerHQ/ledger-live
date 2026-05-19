import { useCallback, useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { useCountervaluesState } from "~/reducers/countervalues";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { PnlDetailItem } from "LLM/features/Pnl/components/PnlDetailDrawer/types";
import { PnlTrend, trendFromSign } from "./utils";

type Drawer = "pnl" | "costBasis" | null;

type CardViewModel = {
  title: string;
  value: string;
  onPress: () => void;
};

type DrawerViewModel = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export type PnlSectionViewModel = {
  shouldRender: boolean;
  unrealised: CardViewModel & { trend: PnlTrend };
  costBasis: CardViewModel;
  pnlDrawer: DrawerViewModel & { description: string; items: PnlDetailItem[] };
  costBasisDrawer: DrawerViewModel & { bodyText: string };
};

const DRAWER_ROW_KEYS = ["unrealisedReturn", "realisedReturn", "totalReturn"] as const;

const EMPTY_ACCOUNTS: Parameters<typeof usePortfolioPnL>[0] = [];

export function usePnlSectionViewModel(): PnlSectionViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { shouldDisplayPnl } = useWalletFeaturesConfig("mobile");
  const accounts = useSelector(shallowAccountsSelector);
  const countervalues = useCountervaluesState();
  const fiat = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const [openDrawer, setOpenDrawer] = useState<Drawer>(null);

  // Skip the (potentially expensive) portfolio walk when the section is hidden.
  const pnl = usePortfolioPnL(shouldDisplayPnl ? accounts : EMPTY_ACCOUNTS, countervalues, fiat);

  const format = useCallback(
    (value: BigNumber, alwaysShowSign?: boolean) =>
      formatCurrencyUnit(fiat.units[0], value, {
        showCode: true,
        locale,
        discreet,
        alwaysShowSign,
      }),
    [fiat, locale, discreet],
  );

  const pnlDrawerItems = useMemo<PnlDetailItem[]>(() => {
    const valueByKey: Record<(typeof DRAWER_ROW_KEYS)[number], BigNumber> = {
      unrealisedReturn: pnl.unrealisedPnL,
      realisedReturn: pnl.realisedPnL,
      totalReturn: pnl.totalPnL,
    };
    return DRAWER_ROW_KEYS.map(key => ({
      title: t(`pnl.drawer.${key}.title`),
      value: format(valueByKey[key], true),
      definition: t(`pnl.drawer.${key}.definition`),
    }));
  }, [pnl.unrealisedPnL, pnl.realisedPnL, pnl.totalPnL, format, t]);

  const openPnlDrawer = useCallback(() => setOpenDrawer("pnl"), []);
  const openCostBasisDrawer = useCallback(() => setOpenDrawer("costBasis"), []);
  const closeDrawer = useCallback(() => setOpenDrawer(null), []);

  return {
    shouldRender: shouldDisplayPnl,
    unrealised: {
      title: t("pnl.unrealisedReturn.title"),
      value: format(pnl.unrealisedPnL),
      trend: trendFromSign(pnl.unrealisedPnL),
      onPress: openPnlDrawer,
    },
    costBasis: {
      title: t("pnl.costBasis.title"),
      value: format(pnl.costBasis),
      onPress: openCostBasisDrawer,
    },
    pnlDrawer: {
      isOpen: openDrawer === "pnl",
      onClose: closeDrawer,
      title: t("pnl.drawer.title"),
      description: t("pnl.drawer.description"),
      items: pnlDrawerItems,
    },
    costBasisDrawer: {
      isOpen: openDrawer === "costBasis",
      onClose: closeDrawer,
      title: t("pnl.costBasis.drawer.title"),
      bodyText: t("pnl.costBasis.drawer.body"),
    },
  };
}
