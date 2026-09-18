import React, { useState } from "react";
import {
  CardTransactionDetail,
  ListItem as CardTransactionListItem,
  type CardTransactionFormatters,
  type CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import {
  AmountDisplay,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
  TileButton,
} from "@ledgerhq/lumen-ui-react";
import { ArrowDown, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { CardAssetDialogCopy, CardAssetRow } from "./types";

type CardAssetDetailsDialogProps = Readonly<{
  isOpen: boolean;
  asset: CardAssetRow | null;
  /** The asset's last few transactions. The section is left out when it has none. */
  transactions?: readonly CardTransactionItem[];
  copy: CardAssetDialogCopy;
  formatBalance?: (value: number) => FormattedValue;
  formatters?: CardTransactionFormatters;
  onClose: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
  onShowHistory: () => void;
}>;

export function CardAssetDetailsDialog({
  isOpen,
  asset,
  transactions = [],
  copy,
  formatBalance,
  formatters,
  onClose,
  onTopUp,
  onWithdraw,
  onShowHistory,
}: CardAssetDetailsDialogProps) {
  // Same inspect dialog as a history row click. It replaces the details one while it is open, the
  // way withdraw does: two stacked dialogs would leave the top one without its own overlay.
  const [inspected, setInspected] = useState<CardTransactionItem | null>(null);

  return (
    <>
      <Dialog
        open={isOpen && inspected === null}
        onOpenChange={open => !open && onClose()}
        height="fixed"
      >
        <DialogContent
          className="bg-canvas-sheet p-0"
          data-testid="card-asset-details-dialog"
          aria-describedby={undefined}
        >
          {asset ? (
            <>
              <DialogHeader
                density="compact"
                title={asset.name}
                description={asset.ticker}
                onClose={onClose}
              />
              {/* `DialogBody` pairs its own `pb-24` with a `-mb-24`, so 48 here nets the 24px. */}
              <DialogBody className="flex flex-col gap-24 pb-48">
                {asset.countervalueAmount === null || !formatBalance ? null : (
                  <div className="flex justify-center py-24">
                    <AmountDisplay
                      value={asset.countervalueAmount}
                      formatter={formatBalance}
                      animate={false}
                    />
                  </div>
                )}
                <div className="flex gap-8">
                  <TileButton icon={Plus} onClick={onTopUp} isFull>
                    {copy.topUp}
                  </TileButton>
                  <TileButton icon={ArrowDown} onClick={onWithdraw} isFull>
                    {copy.withdraw}
                  </TileButton>
                </div>
                {transactions.length ? (
                  <div className="flex flex-col gap-8">
                    <Subheader>
                      <SubheaderRow onClick={onShowHistory}>
                        <SubheaderTitle>{copy.transactions}</SubheaderTitle>
                        <SubheaderShowMore />
                      </SubheaderRow>
                    </Subheader>
                    <div className="flex flex-col gap-2">
                      {transactions.map(item => (
                        <CardTransactionListItem
                          key={item.transaction.id}
                          item={item}
                          formatters={formatters}
                          assetCode={asset.currency}
                          valueLabel={copy.value}
                          onPress={() => setInspected(item)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {inspected ? (
        <CardTransactionDetail
          isOpen
          transaction={inspected.transaction}
          formatters={formatters}
          onClose={() => setInspected(null)}
        />
      ) : null}
    </>
  );
}
