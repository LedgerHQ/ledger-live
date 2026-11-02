import React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { useTranslation } from "@shared/i18n";
import type { AccountAssetPickerProps, AccountAssetPickerRow } from "./AccountAssetPicker.types";
import { useAccountAssetPickerViewModel } from "./useAccountAssetPickerViewModel";

const ICON_SIZE = 48;

function AccountAssetPickerListItem({
  row,
  onSelect,
  testID,
}: Readonly<{
  row: AccountAssetPickerRow;
  onSelect: (id: string) => void;
  testID?: string;
}>) {
  return (
    <ListItem onClick={() => onSelect(row.id)} data-testid={testID}>
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{row.countervalue ?? row.cryptoAmount}</ListItemTitle>
          {row.countervalue ? <ListItemDescription>{row.cryptoAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

export function AccountAssetPicker({
  open,
  rows,
  onSelect,
  onClose,
  testID,
}: AccountAssetPickerProps) {
  const { t } = useTranslation();
  const { rows: shownRows } = useAccountAssetPickerViewModel({ open, rows });

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()} height="fixed">
      <DialogContent data-testid={testID}>
        <DialogHeader
          density="expanded"
          title={t("accountDetailHero.assetPicker.title")}
          onClose={onClose}
        />
        <DialogBody>
          <div className="-mx-8 flex flex-col">
            {shownRows.map(row => (
              <AccountAssetPickerListItem
                key={row.id}
                row={row}
                onSelect={onSelect}
                testID={testID && `${testID}-${row.id}`}
              />
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
