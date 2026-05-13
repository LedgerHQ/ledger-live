import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { formatPrice } from "LLD/utils/formatPrice";
import { buildPnlCards } from "./buildPnlCards";
import { buildPnlDetail } from "./buildPnlDetail";
import type { PnlViewModel } from "./types";

const ZERO = new BigNumber(0);

type Props = {
  distributionItem: DistributionItem;
};

export function usePnlViewModel({ distributionItem }: Props): PnlViewModel {
  const { t } = useTranslation();
  const { shouldDisplayPnl: isPnlFlagOn } = useWalletFeaturesConfig("desktop");
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();

  const [isDetailOpen, setDetailOpen] = useState(false);
  const openDetail = useCallback(() => setDetailOpen(true), []);

  const groupPnl = useAssetGroupPnL(distributionItem.accounts, countervalues, fiatCurrency);
  const {
    unrealisedPnL = ZERO,
    realisedPnL = ZERO,
    totalPnL = ZERO,
    averageEntryPrice = ZERO,
  } = groupPnl ?? {};

  const formatFiat = useCallback(
    (value: BigNumber) =>
      formatPrice(fiatCurrency.units[0], value, { showCode: true, locale, discreet }),
    [fiatCurrency, locale, discreet],
  );

  const items = useMemo(
    () =>
      buildPnlCards({
        unrealisedPnL,
        averageEntryPrice,
        formatFiat,
        onUnrealisedReturnClick: openDetail,
        t,
      }),
    [unrealisedPnL, averageEntryPrice, formatFiat, openDetail, t],
  );

  const detail = useMemo(
    () =>
      buildPnlDetail({
        assetName: distributionItem.currency.name,
        totalPnL,
        unrealisedPnL,
        realisedPnL,
        formatFiat,
        t,
      }),
    [distributionItem.currency.name, totalPnL, unrealisedPnL, realisedPnL, formatFiat, t],
  );

  const shouldDisplayPnl = isPnlFlagOn && distributionItem.accounts.length > 0;

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
