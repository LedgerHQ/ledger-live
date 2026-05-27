import React from "react";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Information, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import type { StakingSectionViewModelResult } from "./useStakingSectionViewModel";
import { StakingCard } from "./components/StakingCard";

const cardClassName = "min-w-0 flex-1";
export const STAKING_SECTION_TEST_ID = "asset-detail-staking-section";

type StakingSectionViewProps = Readonly<
  StakingSectionViewModelResult & {
    pnlVisible?: boolean;
  }
>;

export function StakingSectionView({
  state,
  availableBalanceTooltip,
  availableBalanceLabel,
  earnDepositLabel,
  earnBannerSubtitle,
  earnBannerActionLabel,
  onEarnBannerPress,
  onEarnDepositPress,
  pnlVisible = false,
}: StakingSectionViewProps) {
  if (state.type === "hidden") return null;

  if (state.type === "banner") {
    return (
      <div className="contents" data-testid={STAKING_SECTION_TEST_ID}>
        <StakingCard
          cardType="interactive"
          onClick={onEarnBannerPress}
          data-testid="asset-detail-earn-banner"
          className={cn("flex flex-col", pnlVisible ? "min-w-0 flex-[2]" : cardClassName)}
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
      </div>
    );
  }

  return (
    <div className="contents" data-testid={STAKING_SECTION_TEST_ID}>
      <StakingCard
        cardType="info"
        data-testid="asset-detail-available-balance"
        className={cardClassName}
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
        className={cardClassName}
        title={<span className="body-3 text-muted">{earnDepositLabel}</span>}
        description={<span className="body-2-semi-bold text-base">{state.formattedDeposit}</span>}
        trailing={<ChevronRight size={20} className="text-muted" />}
      />
    </div>
  );
}
