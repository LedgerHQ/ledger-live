import { BigNumber } from "bignumber.js";
import type { TFunction } from "i18next";
import { trendFromSign } from "@ledgerhq/wallet-pnl";
import type { PnLCardProps } from "../components/PnLCard/types";

export type BuildReturnCardInput = {
  id: string;
  titleKey: string;
  value: BigNumber;
  formatFiat: (value: BigNumber) => string;
  t: TFunction;
  onClick?: () => void;
};

export function buildReturnCard({
  id,
  titleKey,
  value,
  formatFiat,
  t,
  onClick,
}: BuildReturnCardInput): PnLCardProps {
  const base = {
    id,
    title: t(titleKey),
    value: formatFiat(value),
    trend: trendFromSign(value),
  };

  return onClick ? { ...base, type: "interactive", onClick } : { ...base, type: "display" };
}
