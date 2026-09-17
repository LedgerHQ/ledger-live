import React, { useCallback } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ASSET_ICON_SIZE = 40;

function CardAssetListItem({ id, ticker, cryptoAmount, ledgerId }: CardAssetRow) {
  return (
    <ListItem data-testid={`card-assets-item-${id}`}>
      <ListItemLeading>
        <CryptoIcon
          ledgerId={ledgerId ?? ""}
          ticker={ticker}
          size={ASSET_ICON_SIZE}
          shape="circle"
        />
        <ListItemContent>
          <ListItemTitle>{ticker}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      {cryptoAmount ? (
        <ListItemTrailing>
          <ListItemContent className="items-end text-end">
            <ListItemTitle>{cryptoAmount}</ListItemTitle>
          </ListItemContent>
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}

function ManageAssetsDialog({
  isOpen,
  title,
  rows,
  addAssetLabel,
  onClose,
  onAddAsset,
}: Readonly<{
  isOpen: boolean;
  title: string;
  rows: readonly CardAssetRow[];
  addAssetLabel: string;
  onClose: () => void;
  onAddAsset?: () => void;
}>) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const handleAddAsset = useCallback(() => {
    onClose();
    onAddAsset?.();
  }, [onAddAsset, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader density="expanded" title={title} onClose={onClose} />
        <DialogBody className="flex flex-col gap-16">
          <div className="flex w-full flex-col gap-8">
            {rows.map(row => (
              <CardAssetListItem key={row.id} {...row} />
            ))}
          </div>
          {onAddAsset ? (
            <Button appearance="base" size="lg" className="w-full" onClick={handleAddAsset}>
              {addAssetLabel}
            </Button>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function CardAssetsView({
  isVisible,
  title,
  status,
  rows,
  emptyLabel,
  errorLabel,
  manageLabel,
  manageTitle,
  addAssetLabel,
  manage,
  onManagePress,
  onManageClose,
  onAddAsset,
}: CardAssetsViewModel) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
          <Button appearance="no-background" size="sm" onClick={onManagePress}>
            {manageLabel}
          </Button>
        </SubheaderRow>
      </Subheader>
      {status === "error" ? <p className="body-2 text-muted">{errorLabel}</p> : null}
      {status === "empty" ? <p className="body-2 text-muted">{emptyLabel}</p> : null}
      {status === "ready" ? (
        <div className="flex w-full flex-col gap-8">
          {rows.map(row => (
            <CardAssetListItem key={row.id} {...row} />
          ))}
        </div>
      ) : null}
      <ManageAssetsDialog
        isOpen={manage === "open"}
        title={manageTitle}
        rows={rows}
        addAssetLabel={addAssetLabel}
        onClose={onManageClose}
        onAddAsset={onAddAsset}
      />
    </div>
  );
}
