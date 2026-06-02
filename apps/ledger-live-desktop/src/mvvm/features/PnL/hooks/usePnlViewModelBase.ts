import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { roundFiatAtoms } from "@ledgerhq/wallet-pnl";
import { buildPnlDetail } from "../builders/buildPnlDetail";
import { buildUnrealisedReturnCard } from "../builders/buildUnrealisedReturnCard";
import { buildInfoCard } from "../builders/buildInfoCard";
import type { PnlNamespace, PnlNumbers, PnlSecondaryCardConfig, PnlViewModel } from "../types";
import type { PnLCardProps } from "../components/PnLCard/types";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

const ZERO = new BigNumber(0);

type BuildCardsContext = {
  namespace: PnlNamespace;
  unrealisedPnL: BigNumber;
  realisedPnL: BigNumber;
  totalPnL: BigNumber;
  formatFiat: (value: BigNumber) => string;
  openDetail: () => void;
  t: ReturnType<typeof useTranslation>["t"];
};

export type UsePnlViewModelBaseInput = {
  namespace: PnlNamespace;
  pnlData: PnlNumbers | null;
  accountsCount: number;
} & (
  | { secondaryCard: PnlSecondaryCardConfig; buildCards?: never }
  | { buildCards: (context: BuildCardsContext) => PnLCardProps[]; secondaryCard?: never }
);

export function usePnlViewModelBase({
  namespace,
  pnlData,
  accountsCount,
  ...cardConfig
}: UsePnlViewModelBaseInput): PnlViewModel {
  const { t } = useTranslation();
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("desktop");
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);

  const [isDetailOpen, setDetailOpen] = useState(false);
  const openDetail = useCallback(() => {
    setDetailOpen(true);
    track("button_clicked", {
      button: "Pnl details",
      page: currentRouteNameRef.current,
    });
  }, []);

  const {
    unrealisedPnL: rawUnrealisedPnL = ZERO,
    realisedPnL: rawRealisedPnL = ZERO,
    totalPnL: rawTotalPnL = ZERO,
  } = pnlData ?? {};

  // Round to the displayed precision so the amount and its trend indicator are
  // derived from the same number: a sub-cent residual must render as 0.00 with
  // a neutral trend, never an up/down arrow.
  const { unrealisedPnL, realisedPnL, totalPnL } = useMemo(
    () => ({
      unrealisedPnL: roundFiatAtoms(rawUnrealisedPnL),
      realisedPnL: roundFiatAtoms(rawRealisedPnL),
      totalPnL: roundFiatAtoms(rawTotalPnL),
    }),
    [rawUnrealisedPnL, rawRealisedPnL, rawTotalPnL],
  );

  const formatFiat = useCallback(
    (value: BigNumber) =>
      formatPrice(fiatCurrency.units[0], value, { showCode: true, locale, discreet }),
    [fiatCurrency, locale, discreet],
  );

  const items = useMemo(() => {
    const context: BuildCardsContext = {
      namespace,
      unrealisedPnL,
      realisedPnL,
      totalPnL,
      formatFiat,
      openDetail,
      t,
    };

    if ("buildCards" in cardConfig && cardConfig.buildCards) {
      return cardConfig.buildCards(context);
    }

    return [
      buildUnrealisedReturnCard({
        namespace,
        unrealisedPnL,
        formatFiat,
        onClick: openDetail,
        t,
      }),
      buildInfoCard({ ...cardConfig.secondaryCard, formatFiat, t }),
    ];
  }, [namespace, unrealisedPnL, realisedPnL, totalPnL, formatFiat, openDetail, cardConfig, t]);

  const detail = useMemo(
    () =>
      buildPnlDetail({
        namespace,
        totalPnL,
        unrealisedPnL,
        realisedPnL,
        formatFiat,
        t,
      }),
    [namespace, totalPnL, unrealisedPnL, realisedPnL, formatFiat, t],
  );

  const shouldDisplayPnl = isPnlFlagOn && accountsCount > 0;

  return {
    shouldDisplayPnl,
    items,
    detail,
    dialog: {
      isOpen: isDetailOpen,
      onOpenChange: setDetailOpen,
      onOpen: openDetail,
    },
  };
}
