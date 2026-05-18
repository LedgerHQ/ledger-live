import BigNumber from "bignumber.js";
import type { DistributionItem } from "@ledgerhq/types-live";

export function computeFiatPortionsFromDistribution(
  distributionItem: Pick<DistributionItem, "amount" | "countervalue">,
  availableBalance: BigNumber,
  earnDeposit: BigNumber,
): { availableFiat: BigNumber; earnDepositFiat: BigNumber } {
  const totalFiat = distributionItem.countervalue ?? 0;
  if (totalFiat === 0) {
    return { availableFiat: new BigNumber(0), earnDepositFiat: new BigNumber(0) };
  }

  const totalCrypto = new BigNumber(distributionItem.amount ?? 0);
  const denominator = totalCrypto.gt(0) ? totalCrypto : availableBalance.plus(earnDeposit);
  if (denominator.isZero()) {
    return { availableFiat: new BigNumber(0), earnDepositFiat: new BigNumber(0) };
  }

  const totalFiatBn = new BigNumber(totalFiat);
  return {
    availableFiat: availableBalance.times(totalFiatBn).dividedBy(denominator),
    earnDepositFiat: earnDeposit.times(totalFiatBn).dividedBy(denominator),
  };
}
