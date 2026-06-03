import type { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { trendFromSign } from "@ledgerhq/wallet-pnl";
import type { PnlReturnCard } from "../types";

export type BuildReturnCardInput = {
  titleKey: string;
  amount: BigNumber;
  formatFiat: (value: BigNumber) => string;
  t: TFunction;
};

export function buildReturnCard({
  titleKey,
  amount,
  formatFiat,
  t,
}: BuildReturnCardInput): PnlReturnCard {
  return {
    title: t(titleKey),
    value: formatFiat(amount),
    trend: trendFromSign(amount),
  };
}
