import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { FeePresetOption } from "../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../hooks/useFeePresetLegends";
import { NetworkFeesMenu } from "./Fees/NetworkFeesMenu";

type AmountFooterProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  onSelectFeeStrategy: (strategy: string) => void;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export function AmountFooter({
  account,
  parentAccount,
  transaction,
  status,
  feesRowLabel,
  feesRowValue,
  feesRowStrategyLabel,
  selectedFeeStrategy,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
  onSelectFeeStrategy,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
}: AmountFooterProps) {
  return (
    <div className="mt-56 pt-12">
      <div className="border-t border-muted-subtle" />
      <NetworkFeesMenu
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        feesLabel={feesRowLabel}
        feesValue={feesRowValue}
        feesStrategyLabel={feesRowStrategyLabel}
        selectedStrategy={selectedFeeStrategy}
        feePresetOptions={feePresetOptions}
        fiatByPreset={fiatByPreset}
        legendByPreset={legendByPreset}
        onSelectStrategy={onSelectFeeStrategy}
      />
      <Button
        appearance="base"
        size="lg"
        isFull
        onClick={reviewShowIcon ? onReview : onGetFunds}
        disabled={reviewDisabled}
        loading={reviewLoading}
        icon={reviewShowIcon ? LedgerLogo : undefined}
        className="rounded-full"
      >
        {reviewLoading ? "" : reviewLabel}
      </Button>
    </div>
  );
}
