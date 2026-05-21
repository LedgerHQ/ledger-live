import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { BalanceDetailsViewModelResult } from "./useBalanceDetailsViewModel";
import { TotalBalanceView } from "./TotalBalanceView";
import { EarnBannerView } from "./EarnBannerView";
import { EarnCardsView } from "./EarnCardsView";
import { SectionSkeleton } from "../SectionSkeleton";

type EarnState = BalanceDetailsViewModelResult["earnState"];

type Props = Readonly<{
  hasAccounts: boolean;
  discreet: boolean;
  counterValue: number | undefined;
  counterValueFormatter: (value: number) => FormattedValue;
  formattedTotalBalance: string;
  earnState: EarnState;
  onTransferPress: () => void;
  onEarnBannerPress: () => void;
  onEarnDepositPress: () => void;
  isLoading: boolean;
}>;

export function BalanceDetailsView({
  hasAccounts,
  discreet,
  counterValue,
  counterValueFormatter,
  formattedTotalBalance,
  earnState,
  onTransferPress,
  onEarnBannerPress,
  onEarnDepositPress,
  isLoading,
}: Props) {
  if (isLoading && !hasAccounts) {
    return <SectionSkeleton rows={1} rowHeight="s56" />;
  }

  if (!hasAccounts) {
    if (earnState.type !== "banner") return null;
    return (
      <Box testID={ASSET_DETAIL_TEST_IDS.balanceDetails} lx={containerStyle}>
        <EarnBannerView label={earnState.label} onPress={onEarnBannerPress} />
      </Box>
    );
  }

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceDetails} lx={containerStyle}>
      <TotalBalanceView
        discreet={discreet}
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
