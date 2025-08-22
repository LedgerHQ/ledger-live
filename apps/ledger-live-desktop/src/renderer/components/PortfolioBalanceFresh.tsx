import React from "react";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import { useFreshPortfolioBalance, useHasFreshBalances } from "~/renderer/hooks/useFreshPortfolio";

type Props = {
  unit?: any;
  fontSize?: number;
  normalBalance: any; // The normal balance being displayed
  showLabel?: boolean;
};

/**
 * PortfolioBalanceFresh - Shows fresh balance next to normal portfolio balance
 *
 * Usage: Add next to your existing portfolio balance display
 * Example: <FormattedVal .../> <PortfolioBalanceFresh ... />
 */
export default function PortfolioBalanceFresh({
  unit,
  fontSize = 8,
  normalBalance,
  showLabel = true,
}: Props) {
  const freshTotal = useFreshPortfolioBalance();
  const hasFresh = useHasFreshBalances();

  const hasDifference =
    hasFresh &&
    !freshTotal.eq(typeof normalBalance === "number" ? normalBalance : normalBalance.toNumber());

  if (!hasFresh) {
    return null; // Don't show if no fresh balances
  }

  return (
    <Box horizontal alignItems="center" ml={3}>
      <Text color="palette.text.shade50" fontSize={3} mr={2}>
        |
      </Text>

      <Box>
        {showLabel && (
          <Box horizontal alignItems="center" mb={1}>
            <Text fontSize={2} color="palette.text.shade50">
              Fresh
            </Text>
            <Text fontSize={2} color="palette.primary.main" ml={1}>
              ⚡
            </Text>
          </Box>
        )}

        <FormattedVal
          alwaysShowSign={false}
          animateTicker={false}
          color={hasDifference ? "palette.primary.main" : "palette.text.shade100"}
          unit={unit}
          showCode
          val={freshTotal}
          fontSize={fontSize}
        />
      </Box>
    </Box>
  );
}
