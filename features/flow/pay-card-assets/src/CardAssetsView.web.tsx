import React from "react";
import {
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
