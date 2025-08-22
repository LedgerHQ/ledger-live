import React from "react";
import { useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import { hasFreshBalanceSelector } from "~/renderer/selectors/freshBalances";
import { State } from "~/renderer/reducers";

type Props = {
  account: AccountLike;
  unit: Unit;
  disableRounding?: boolean;
};

/**
 * DualBalance - Shows both normal and fresh balance side by side for comparison
 *
 * This component demonstrates the difference between:
 * - Normal balance (account.balance) - current implementation
 * - Fresh balance - Step 1 implementation with fast feedback
 */
export default function DualBalance({ account, unit, disableRounding = false }: Props) {
  const freshBalance = useSelector((state: State) => state.freshBalances[account.id] || null);
  const hasFresh = useSelector((state: State) => hasFreshBalanceSelector(account.id)(state));

  const normalBalance = account.balance;
  const balancesAreDifferent = freshBalance && !freshBalance.eq(normalBalance);

  return (
    <Box flex="30%" justifyContent="center" fontSize={4}>
      <Box horizontal alignItems="center" justifyContent="center">
        {/* Normal Balance */}
        <Box flex={1} justifyContent="center">
          <Text fontSize={2} color="palette.text.shade50" textAlign="center" mb={1}>
            Normal
          </Text>
          <FormattedVal
            alwaysShowSign={false}
            animateTicker={false}
            ellipsis
            color="palette.text.shade100"
            unit={unit}
            showCode
            val={normalBalance}
            disableRounding={disableRounding}
          />
        </Box>

        {/* Separator */}
        <Box mx={2}>
          <Text color="palette.text.shade50">|</Text>
        </Box>

        {/* Fresh Balance */}
        <Box flex={1} justifyContent="center">
          <Box horizontal alignItems="center" justifyContent="center" mb={1}>
            <Text fontSize={2} color="palette.text.shade50" textAlign="center">
              Fresh
            </Text>
            {hasFresh && (
              <Text fontSize={2} color="palette.primary.main" ml={1}>
                ⚡
              </Text>
            )}
          </Box>
          <FormattedVal
            alwaysShowSign={false}
            animateTicker={false}
            ellipsis
            color={balancesAreDifferent ? "palette.primary.main" : "palette.text.shade100"}
            unit={unit}
            showCode
            val={freshBalance || normalBalance}
            disableRounding={disableRounding}
          />
        </Box>
      </Box>

      {/* Difference indicator */}
      {balancesAreDifferent && (
        <Box mt={1} justifyContent="center">
          <Text fontSize={1} color="palette.warning.main" textAlign="center">
            ⚠️ Different values detected
          </Text>
        </Box>
      )}
    </Box>
  );
}
