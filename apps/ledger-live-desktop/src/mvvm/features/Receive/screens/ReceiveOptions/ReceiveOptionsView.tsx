import React from "react";
import { useTranslation } from "react-i18next";
import {
  ListItemTitle,
  ListItemDescription,
  ListItemContent,
  ListItem,
  ListItemLeading,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Bank, QrCode } from "@ledgerhq/lumen-ui-react/symbols";

export type ReceiveOptionsViewProps = Readonly<{
  onGoToBank: () => void;
  onGoToCrypto: () => void;
}>;

export function ReceiveOptionsView({ onGoToBank, onGoToCrypto }: ReceiveOptionsViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8" data-testid="receive-step-options">
      <ListItem onClick={onGoToCrypto} data-testid="receive-step-options-crypto">
        <ListItemLeading>
          <Spot appearance="icon" icon={QrCode} />
          <ListItemContent>
            <ListItemTitle>{t("newReceive.steps.options.fromCrypto.title")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
      <ListItem onClick={onGoToBank} data-testid="receive-step-options-bank">
        <ListItemLeading>
          <Spot appearance="icon" icon={Bank} />
          <ListItemContent>
            <ListItemTitle>{t("newReceive.steps.options.fromBank.title")}</ListItemTitle>
            <ListItemDescription>
              {t("newReceive.steps.options.fromBank.description")}
            </ListItemDescription>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
    </div>
  );
}
