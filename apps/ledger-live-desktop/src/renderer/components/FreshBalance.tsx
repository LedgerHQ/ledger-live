import React from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import {
  displayBalanceSelector,
  hasFreshBalanceSelector,
} from "~/renderer/selectors/freshBalances";
import { State } from "~/renderer/reducers";

type Props = {
  account: Account;
  unit: Unit;
  disableRounding?: boolean;
  showFreshIndicator?: boolean;
};

/**
 * FreshBalance - Demo component for Step 1 of balance freshness strategy
 *
 * This component demonstrates the fresh balance feature:
 * - Shows fresh balance when available (from quick sync callback)
 * - Falls back to account.balance when no fresh balance
 * - Optionally shows an indicator when displaying fresh balance
 */
export default function FreshBalance({
  account,
  unit,
  disableRounding = false,
  showFreshIndicator = true,
}: Props) {
  const displayBalance = useSelector((state: State) => displayBalanceSelector(account)(state));
  const hasFresh = useSelector((state: State) => hasFreshBalanceSelector(account.id)(state));

  return (
    <Box flex="30%" justifyContent="center" fontSize={4}>
      <Box horizontal alignItems="center">
        <FormattedVal
          alwaysShowSign={false}
          animateTicker={false}
          ellipsis
          color="palette.text.shade100"
          unit={unit}
          showCode
          val={displayBalance}
          disableRounding={disableRounding}
        />
        {showFreshIndicator && hasFresh && (
          <Box ml={2}>
            <Text
              fontSize={2}
              color="palette.primary.main"
              title="Fresh balance - updated during sync for faster feedback"
            >
              ⚡
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
