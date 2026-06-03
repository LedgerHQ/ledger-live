import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { DistributionItem } from "@ledgerhq/types-live";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import type { BalanceDetailsViewModelResult } from "./useBalanceDetailsViewModel";
import { TotalBalanceView } from "./TotalBalanceView";
import { EarnBannerView } from "./EarnBannerView";
import { EarnCardsView } from "./EarnCardsView";
import { SectionSkeleton } from "../SectionSkeleton";
import { PnLSection } from "../PnLSection";

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
  onAvailableBalanceTooltipOpen: (open: boolean) => void;
  isLoading: boolean;
  distributionItem: DistributionItem | undefined;
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
  onAvailableBalanceTooltipOpen,
  isLoading,
  distributionItem,
}: Props) {
  if (isLoading && !hasAccounts) {
    return <SectionSkeleton rows={1} rowHeight="s56" />;
  }

  if (!hasAccounts) {
    if (earnState.type !== "banner") return null;
    return (
      <Box testID={ASSET_DETAIL_TEST_IDS.balanceDetails}>
        <EarnBannerView label={earnState.label} onPress={onEarnBannerPress} />
      </Box>
    );
  }

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.balanceDetails}>
      <TotalBalanceView
        discreet={discreet}
        counterValue={counterValue}
        counterValueFormatter={counterValueFormatter}
        formattedTotalBalance={formattedTotalBalance}
        onTransferPress={onTransferPress}
      />

      <Box lx={earnPnlGroupStyle}>
        <PnLSection distributionItem={distributionItem} isLoading={isLoading} />

        {earnState.type === "banner" && (
          <EarnBannerView label={earnState.label} onPress={onEarnBannerPress} />
        )}

        {earnState.type === "staked" && (
          <EarnCardsView
            formattedAvailable={earnState.formattedAvailable}
            formattedDeposit={earnState.formattedDeposit}
            onEarnDepositPress={onEarnDepositPress}
            onAvailableBalanceTooltipOpen={onAvailableBalanceTooltipOpen}
          />
        )}
      </Box>
    </Box>
  );
}

const earnPnlGroupStyle: LumenViewStyle = {
  marginTop: "s24",
  gap: "s12",
};
