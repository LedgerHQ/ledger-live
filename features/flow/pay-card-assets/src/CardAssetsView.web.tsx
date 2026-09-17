import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { Bundle } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ASSET_ICON_SIZE = 40;

function CardAssetIcon({ ledgerId, ticker }: Pick<CardAssetRow, "ledgerId" | "ticker">) {
  const icon =
    ledgerId == null ? (
      <Spot appearance="icon" icon={Bundle} size={ASSET_ICON_SIZE} />
    ) : (
      <CryptoIcon ledgerId={ledgerId} ticker={ticker} size={ASSET_ICON_SIZE} shape="circle" />
    );

  return (
    <div
      className="pointer-events-none flex shrink-0 items-center justify-center select-none [&_img]:block"
      style={{ width: ASSET_ICON_SIZE, height: ASSET_ICON_SIZE }}
    >
      {icon}
    </div>
  );
}

function CardAssetListItem({ id, name, ticker, cryptoAmount, fiatAmount, ledgerId }: CardAssetRow) {
  return (
    <ListItem data-testid={`card-assets-item-${id}`}>
      <ListItemLeading className="items-center">
        <CardAssetIcon ledgerId={ledgerId} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription>{ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      {fiatAmount || cryptoAmount ? (
        <ListItemTrailing>
          <ListItemContent className="items-end text-end">
            {fiatAmount ? <ListItemTitle>{fiatAmount}</ListItemTitle> : null}
            {cryptoAmount ? <ListItemDescription>{cryptoAmount}</ListItemDescription> : null}
          </ListItemContent>
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}

export function CardAssetsView({
  isVisible,
  title,
  status,
  rows,
  emptyLabel,
  errorLabel,
}: CardAssetsViewModel) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
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
    </div>
  );
}
