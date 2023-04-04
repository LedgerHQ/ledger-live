import React from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { PortfolioRange } from "@ledgerhq/live-common/portfolio/v2/types";
import { useBalanceHistoryWithCountervalue } from "~/renderer/actions/portfolio";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { PlaceholderLine } from "~/renderer/components/Placeholder";
type Props = {
  account: AccountLike;
  range: PortfolioRange;
};
export default function Delta({ account, range }: Props) {
  const { countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range,
  });
  return (
    <Box flex="10%" justifyContent="flex-end">
      {!countervalueChange.percentage ? (
        <PlaceholderLine width={16} height={2} />
      ) : (
        <FormattedVal
          isPercent
          val={Math.round(countervalueChange.percentage * 100)}
          alwaysShowSign
          fontSize={3}
        />
      )}
    </Box>
  );
}
