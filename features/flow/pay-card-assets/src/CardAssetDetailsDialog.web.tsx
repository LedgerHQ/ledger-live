import React, { useState } from "react";
import {
  CardTransactionDetail,
  ListItem as CardTransactionListItem,
  type CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import {
  AmountDisplay,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
  TileButton,
} from "@ledgerhq/lumen-ui-react";
import { ArrowDown, CreditCard, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { CardAssetDetailsContentProps, CardAssetRow } from "./types";

const LOADING_FORMATTER: (value: number) => FormattedValue = () => ({
  integerPart: "0",
  decimalPart: "00",
  currencyText: "",
  decimalSeparator: ".",
  currencyPosition: "start",
});

type CardAssetDetailsDialogProps = Omit<CardAssetDetailsContentProps, "asset"> &
  Readonly<{
    isOpen: boolean;
    asset: CardAssetRow | null;
    onClose: () => void;
  }>;

export function CardAssetDetailsDialog({
  isOpen,
  asset,
  transactions = [],
  formatBalance,
  formatters,
  onClose,
  onTopUp,
  onWithdraw,
  onShowHistory,
}: CardAssetDetailsDialogProps) {
  // Same inspect dialog as a history row click. It replaces the details one while it is open, the
  // way withdraw does: two stacked dialogs would leave the top one without its own overlay.
  const { t } = useTranslation();
  const [selectedTransaction, setSelectedTransaction] = useState<CardTransactionItem | null>(null);
  const isAmountLoading = asset !== null && (asset.countervalueAmount === null || !formatBalance);

  return (
    <>
      <Dialog
        open={isOpen && selectedTransaction === null}
        onOpenChange={open => !open && onClose()}
        height="fixed"
      >
        <DialogContent className="bg-canvas-sheet p-0" aria-describedby={undefined}>
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
                <div className="flex justify-center py-24">
                  <AmountDisplay
                    value={asset.countervalueAmount ?? 0}
                    formatter={formatBalance ?? LOADING_FORMATTER}
                    loading={isAmountLoading}
                    animate
                    aria-label={`${asset.name} ${asset.ticker}`}
                    aria-busy={isAmountLoading}
                  />
                </div>
                <div className="flex gap-8">
                  <TileButton icon={Plus} onClick={onTopUp} isFull>
                    {t("payTab.card.assets.details.topUp")}
                  </TileButton>
                  <TileButton icon={ArrowDown} onClick={onWithdraw} isFull>
                    {t("payTab.card.assets.details.withdraw")}
                  </TileButton>
                </div>
                {transactions.length > 0 ? (
                  <div className="flex flex-col gap-8">
                    <Subheader>
                      <SubheaderRow onClick={onShowHistory}>
                        <SubheaderTitle>
                          {t("payTab.card.assets.details.transactions")}
                        </SubheaderTitle>
                        <SubheaderShowMore />
                      </SubheaderRow>
                    </Subheader>
                    <div className="flex flex-col gap-2">
                      {transactions.map(item => (
                        <CardTransactionListItem
                          key={item.transaction.id}
                          item={item}
                          formatters={formatters}
                          onPress={() => setSelectedTransaction(item)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-24 py-24 text-center">
                    <Spot appearance="icon" icon={CreditCard} size={72} />
                    <p className="heading-4-semi-bold text-base">
                      {t("payTab.cardTransactions.history.empty.title")}
                    </p>
                  </div>
                )}
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {selectedTransaction ? (
        <CardTransactionDetail
          isOpen
          transaction={selectedTransaction.transaction}
          formatters={formatters}
          onClose={() => setSelectedTransaction(null)}
        />
      ) : null}
    </>
  );
}
