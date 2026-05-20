import React from "react";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Information, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { StakingSectionViewModelResult } from "./useStakingSectionViewModel";
import { StakingCard } from "./components/StakingCard";

type StakingSectionViewProps = Readonly<StakingSectionViewModelResult>;

export function StakingSectionView({
  state,
  availableBalanceTooltip,
  availableBalanceLabel,
  earnDepositLabel,
  earnBannerSubtitle,
  earnBannerActionLabel,
  onEarnBannerPress,
  onEarnDepositPress,
}: StakingSectionViewProps) {
  if (state.type === "hidden") return null;

  if (state.type === "banner") {
    return (
      <StakingCard
        cardType="interactive"
        onClick={onEarnBannerPress}
        data-testid="asset-detail-earn-banner"
        className="flex flex-col"
        title={<span className="body-2-semi-bold text-base">{state.label}</span>}
        description={<span className="body-3 text-muted">{earnBannerSubtitle}</span>}
        trailing={
          <IconButton
            appearance="transparent"
            size="sm"
            icon={Plus}
            aria-label={earnBannerActionLabel}
            onClick={event => {
              event.stopPropagation();
              onEarnBannerPress();
            }}
          />
        }
      />
    );
  }

  return (
    <div className="flex gap-8" data-testid="asset-detail-staking-section">
      <StakingCard
        cardType="info"
        data-testid="asset-detail-available-balance"
        className="min-w-0 flex-1"
        title={
          <div className="flex items-center gap-4 text-muted">
            <span className="body-3">{availableBalanceLabel}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help">
                  <Information size={16} />
                </span>
              </TooltipTrigger>
              <TooltipContent>{availableBalanceTooltip}</TooltipContent>
            </Tooltip>
          </div>
        }
        description={<span className="body-2-semi-bold text-base">{state.formattedAvailable}</span>}
      />
      <StakingCard
        cardType="interactive"
        onClick={onEarnDepositPress}
        data-testid="asset-detail-earn-deposit"
        className="min-w-0 flex-1"
        title={<span className="body-3 text-muted">{earnDepositLabel}</span>}
        description={<span className="body-2-semi-bold text-base">{state.formattedDeposit}</span>}
        trailing={<ChevronRight size={20} className="text-muted" />}
      />
    </div>
  );
}
