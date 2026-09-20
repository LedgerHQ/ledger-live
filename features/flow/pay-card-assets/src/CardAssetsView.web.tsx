import React from "react";
import {
  Link,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Skeleton,
  Subheader,
  SubheaderInfo,
  SubheaderTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { useTranslation } from "@shared/i18n";
import { CardAssetDetailsDialog } from "./CardAssetDetailsDialog.web";
import { CardAssetDetailsWithdrawDialog } from "./CardAssetDetailsWithdrawDialog.web";
import { CardAssetsManageDialog } from "./CardAssetsManageDialog.web";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ICON_SIZE = 48;
// Non-breaking space: a plain space collapses and the reserved line loses its height.
const COUNTERVALUE_PLACEHOLDER = "\u00a0";

function AssetRow({
  row,
  onPress,
}: Readonly<{ row: CardAssetRow; onPress: (row: CardAssetRow) => void }>) {
  return (
    <ListItem className="bg-surface py-8" onClick={() => onPress(row)}>
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} shape="circle" />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{row.countervalue ?? COUNTERVALUE_PLACEHOLDER}</ListItemTitle>
          <ListItemDescription>{row.cryptoAmount}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

type AssetsBodyProps = Readonly<Pick<CardAssetsViewModel, "status" | "rows" | "onAssetPress">>;

function AssetsBody({ status, rows, onAssetPress }: AssetsBodyProps) {
  const { t } = useTranslation();
  if (status === "error") {
    return <p className="body-2 text-muted">{t("payTab.card.assets.error")}</p>;
  }
  if (status === "empty") {
    return <p className="body-2 text-muted">{t("payTab.card.assets.empty")}</p>;
  }
  if (status === "loading") {
    return (
      <div className="flex flex-col">
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {rows.map(row => (
        <AssetRow key={row.id} row={row} onPress={onAssetPress} />
      ))}
    </div>
  );
}

export function CardAssetsView({
  isVisible,
  status,
  rows,
  dialogState,
  selectedAsset,
  selectedAssetTransactions,
  formatBalance,
  formatters,
  onAssetPress,
  onDialogClose,
  onTopUpPress,
  onWithdrawPress,
  onWithdrawClose,
  onShowHistoryPress,
  onWithdrawContinue,
  onManagePress,
  onAddAssetPress,
  onReorderAssets,
  reorderingAssetId,
}: CardAssetsViewModel) {
  const { t } = useTranslation();
  const title = t("payTab.card.assets.title");
  const infoLabel = t("payTab.card.assets.info");
  const manageLabel = t("payTab.card.assets.manage");

  if (!isVisible) return null;

  return (
    <>
      <section aria-label={title} className="flex flex-col gap-12">
        <Subheader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SubheaderTitle as="h2">{title}</SubheaderTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SubheaderInfo aria-label={infoLabel} />
                </TooltipTrigger>
                <TooltipContent>{infoLabel}</TooltipContent>
              </Tooltip>
            </div>
            <Link appearance="accent" underline={false} size="sm" asChild>
              <button type="button" onClick={onManagePress}>
                {manageLabel}
              </button>
            </Link>
          </div>
        </Subheader>

        <AssetsBody status={status} rows={rows} onAssetPress={onAssetPress} />
      </section>
      <CardAssetDetailsDialog
        isOpen={dialogState === "details"}
        asset={selectedAsset}
        transactions={selectedAssetTransactions}
        formatBalance={formatBalance}
        formatters={formatters}
        onClose={onDialogClose}
        onTopUp={onTopUpPress}
        onWithdraw={onWithdrawPress}
        onShowHistory={onShowHistoryPress}
      />
      <CardAssetDetailsWithdrawDialog
        isOpen={dialogState === "withdraw"}
        onClose={onWithdrawClose}
        onContinue={onWithdrawContinue}
      />
      <CardAssetsManageDialog
        isOpen={dialogState === "manage"}
        rows={rows}
        onClose={onDialogClose}
        onAddAsset={onAddAssetPress}
        onReorder={onReorderAssets}
        reorderingAssetId={reorderingAssetId}
      />
    </>
  );
}
