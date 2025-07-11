import React from "react";
import { useBalanceHistoryWithCountervalue } from "~/renderer/actions/portfolio";
import { PortfolioRange, AccountLike } from "@ledgerhq/types-live";
import { useCurrencyColor } from "~/renderer/getCurrencyColor";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import Chart from "~/renderer/components/ChartPreview";
import useTheme from "~/renderer/hooks/useTheme";
import { Data } from "~/renderer/components/Chart/types";

type Props = {
  account: AccountLike;
  range: PortfolioRange;
};

function Body({ account, range }: Props) {
  const { history, countervalueAvailable, countervalueChange } = useBalanceHistoryWithCountervalue({
    account,
    range,
  });
  const bgColor = useTheme().colors.palette.background.paper;
  const currency = getAccountCurrency(account);
  const color = useCurrencyColor(currency, bgColor);
  return (
    <Box flow={4}>
      <Box flow={2} horizontal>
        <Box justifyContent="center">
          <CounterValue
            currency={currency}
            value={history[history.length - 1].value}
            animateTicker={false}
            showCode
            fontSize={3}
            color="palette.text.shade80"
          />
        </Box>
        <Box grow justifyContent="center">
          {!countervalueChange.percentage ? null : (
            <FormattedVal
              isPercent
              val={Math.round(countervalueChange.percentage * 100)}
              alwaysShowSign
              fontSize={3}
            />
          )}
        </Box>
      </Box>
      <Chart
        // TODO make date non optional
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        data={history as Data}
        color={color}
        valueKey={countervalueAvailable ? "countervalue" : "value"}
        height={52}
      />
    </Box>
  );
}

const MemoedBody: React.ComponentType<Props> = React.memo(Body);
export default MemoedBody;
