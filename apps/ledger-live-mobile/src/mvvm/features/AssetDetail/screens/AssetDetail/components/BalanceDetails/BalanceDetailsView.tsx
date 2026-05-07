import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { BalanceDetailsViewModelResult } from "./useBalanceDetailsViewModel";
import { TotalBalanceView } from "./TotalBalanceView";
import { EarnBannerView } from "./EarnBannerView";
import { EarnCardsView } from "./EarnCardsView";

type EarnState = BalanceDetailsViewModelResult["earnState"];

type Props = Readonly<{
  hasAccounts: boolean;
  counterValue: number | undefined;
  counterValueFormatter: (value: number) => FormattedValue;
  formattedTotalBalance: string;
  earnState: EarnState;
  onTransferPress: () => void;
  onEarnBannerPress: () => void;
  onEarnDepositPress: () => void;
}>;

export function BalanceDetailsView({
  hasAccounts,
  counterValue,
  counterValueFormatter,
  formattedTotalBalance,
  earnState,
  onTransferPress,
  onEarnBannerPress,
  onEarnDepositPress,
}: Props) {
  if (!hasAccounts) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceDetails} lx={containerStyle}>
      <TotalBalanceView
        counterValue={counterValue}
        counterValueFormatter={counterValueFormatter}
        formattedTotalBalance={formattedTotalBalance}
        onTransferPress={onTransferPress}
      />

      {earnState.type === "banner" && (
        <EarnBannerView label={earnState.label} onPress={onEarnBannerPress} />
      )}

      {earnState.type === "staked" && (
        <EarnCardsView
          formattedAvailable={earnState.formattedAvailable}
          formattedDeposit={earnState.formattedDeposit}
          onEarnDepositPress={onEarnDepositPress}
        />
      )}
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s12",
};
