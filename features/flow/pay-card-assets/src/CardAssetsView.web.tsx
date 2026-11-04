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
import { CardAssetDetailsDialog } from "./CardAssetDetailsDialog";
import { CardAssetDetailsWithdrawDialog } from "./CardAssetDetailsWithdrawDialog";
import { CardAssetsEmptyState } from "./CardAssetsEmptyState";
import { CardAssetsManageDialog } from "./CardAssetsManageDialog";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ICON_SIZE = 48;
// Non-breaking space: a plain space collapses and the reserved line loses its height.
const COUNTERVALUE_PLACEHOLDER = "\u00a0";

function AssetRow({
  row,
  onPress,
}: Readonly<{ row: CardAssetRow; onPress: (row: CardAssetRow) => void }>) {
  return (
    <ListItem
      className="bg-surface py-8"
      data-testid={`card-asset-${row.id}`}
      onClick={() => onPress(row)}
    >
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} shape="circle" />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle data-testid={`card-asset-countervalue-${row.id}`}>
            {row.countervalue ?? COUNTERVALUE_PLACEHOLDER}
          </ListItemTitle>
          <ListItemDescription>{row.cryptoAmount}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

type AssetsBodyProps = Readonly<
  Pick<CardAssetsViewModel, "status" | "rows" | "onOpenAsset" | "onRetry" | "onAddAsset">
>;

function AssetsBody({ status, rows, onOpenAsset, onRetry, onAddAsset }: AssetsBodyProps) {
  if (status === "error") {
    return <CardAssetsEmptyState variant="error" onRetry={onRetry} />;
  }
  if (status === "empty") {
    return <CardAssetsEmptyState variant="empty" onRetry={onRetry} onAddAsset={onAddAsset} />;
  }
  if (status === "loading") {
    return (
      <div className="flex flex-col" data-testid="card-assets-loading-state">
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {rows.map(row => (
        <AssetRow key={row.id} row={row} onPress={onOpenAsset} />
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
  dialogCopy,
  discreet,
  onOpenAsset,
  onDialogClose,
  onTopUpAsset,
  onOpenWithdraw,
  onWithdrawClose,
  onShowHistory,
  onWithdrawContinue,
  onManageAssets,
  onRetry,
  onAddAsset,
  onMoveAsset,
  reorderingAssetIds,
}: CardAssetsViewModel) {
  const { t } = useTranslation();
  const title = t("payTab.card.assets.title");
  const infoLabel = t("payTab.card.assets.info");
  const manageLabel = t("payTab.card.assets.manage");

  if (!isVisible) return null;

  return (
    <>
      <section aria-label={title} className="flex flex-col gap-12" data-testid="card-assets">
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
            {status === "ready" ? (
              <Link appearance="accent" underline={false} size="sm" asChild>
                <button type="button" onClick={onManageAssets}>
                  {manageLabel}
                </button>
              </Link>
            ) : null}
          </div>
        </Subheader>

        <AssetsBody
          status={status}
          rows={rows}
          onOpenAsset={onOpenAsset}
          onRetry={onRetry}
          onAddAsset={onAddAsset}
        />
      </section>
      <CardAssetDetailsDialog
        isOpen={dialogState === "details"}
        asset={selectedAsset}
        transactions={selectedAssetTransactions}
        copy={dialogCopy}
        formatBalance={formatBalance}
        formatters={formatters}
        discreet={discreet}
        onClose={onDialogClose}
        onTopUp={onTopUpAsset}
        onWithdraw={onOpenWithdraw}
        onShowHistory={onShowHistory}
      />
      <CardAssetDetailsWithdrawDialog
        isOpen={dialogState === "withdraw"}
        copy={dialogCopy}
        onClose={onWithdrawClose}
        onContinue={onWithdrawContinue}
      />
      <CardAssetsManageDialog
        isOpen={dialogState === "manage"}
        rows={rows}
        onClose={onDialogClose}
        onAddAsset={onAddAsset}
        onMoveAsset={onMoveAsset}
        reorderingAssetIds={reorderingAssetIds}
      />
    </>
  );
}
