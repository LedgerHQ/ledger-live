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
import type { AccountAssetPickerProps } from "./types";

const ICON_SIZE = 48;

export function AccountAssetPickerDialog({
  open,
  rows,
  onSelect,
  onClose,
  testID,
}: AccountAssetPickerProps) {
  const { t } = useTranslation();

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
            {rows.map(row => (
              <ListItem
                key={row.id}
                onClick={() => onSelect(row.id)}
                data-testid={testID && `${testID}-${row.id}`}
              >
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
                    {row.countervalue ? (
                      <ListItemDescription>{row.cryptoAmount}</ListItemDescription>
                    ) : null}
                  </ListItemContent>
                </ListItemTrailing>
              </ListItem>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
