import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { buildPnlDetail } from "../builders/buildPnlDetail";
import { buildUnrealisedReturnCard } from "../builders/buildUnrealisedReturnCard";
import { buildInfoCard } from "../builders/buildInfoCard";
import type { PnlNamespace, PnlNumbers, PnlSecondaryCardConfig, PnlViewModel } from "../types";

const ZERO = new BigNumber(0);

export type UsePnlViewModelBaseInput = {
  namespace: PnlNamespace;
  pnlData: PnlNumbers | null;
  secondaryCard: PnlSecondaryCardConfig;
  accountsCount: number;
};

export function usePnlViewModelBase({
  namespace,
  pnlData,
  secondaryCard,
  accountsCount,
}: UsePnlViewModelBaseInput): PnlViewModel {
  const { t } = useTranslation();
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("desktop");
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);

  const [isDetailOpen, setDetailOpen] = useState(false);
  const openDetail = useCallback(() => setDetailOpen(true), []);

  const { unrealisedPnL = ZERO, realisedPnL = ZERO, totalPnL = ZERO } = pnlData ?? {};

  const formatFiat = useCallback(
    (value: BigNumber) =>
      formatPrice(fiatCurrency.units[0], value, { showCode: true, locale, discreet }),
    [fiatCurrency, locale, discreet],
  );

  const items = useMemo(
    () => [
      buildUnrealisedReturnCard({
        namespace,
        unrealisedPnL,
        formatFiat,
        onClick: openDetail,
        t,
      }),
      buildInfoCard({ ...secondaryCard, formatFiat, t }),
    ],
    [namespace, unrealisedPnL, formatFiat, openDetail, secondaryCard, t],
  );

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
    },
  };
}
