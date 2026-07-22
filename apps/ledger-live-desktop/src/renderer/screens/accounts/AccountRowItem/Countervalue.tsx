import React from "react";
import { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { useBalanceHistoryWithCountervalue } from "~/renderer/actions/portfolio";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import { PlaceholderLine } from "~/renderer/components/Placeholder";
type Props = {
  account: AccountLike;
  range: PortfolioRange;
  currency: CryptoCurrency | TokenCurrency;
};
export default function Countervalue({ account, range, currency }: Props) {
  const histo = useBalanceHistoryWithCountervalue({
    account,
    range,
  });
  const balanceEnd = histo.history[histo.history.length - 1].value;
  const placeholder = <PlaceholderLine width={16} height={2} />;
  return (
    <Box flex="20%">
      {histo.countervalueAvailable ? (
        <CounterValue
          currency={currency}
          value={balanceEnd}
          animateTicker={false}
          showCode
          fontSize={3}
          color="neutral.c80"
          placeholder={placeholder}
        />
      ) : (
        placeholder
      )}
    </Box>
  );
}
