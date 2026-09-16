import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ICON_SIZE = 48;

function AssetRow({ row }: Readonly<{ row: CardAssetRow }>) {
  return (
    <ListItem className="bg-surface" data-testid={`card-asset-${row.id}`}>
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} shape="circle" />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          {row.countervalue === null ? null : (
            <ListItemTitle data-testid={`card-asset-countervalue-${row.id}`}>
              {row.countervalue}
            </ListItemTitle>
          )}
          <ListItemDescription>{row.cryptoAmount}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

type AssetsBodyProps = Readonly<
  Pick<CardAssetsViewModel, "status" | "rows" | "emptyLabel" | "errorLabel">
>;

function AssetsBody({ status, rows, emptyLabel, errorLabel }: AssetsBodyProps) {
  if (status === "error") return <p className="body-2 text-muted">{errorLabel}</p>;
  if (status === "empty") return <p className="body-2 text-muted">{emptyLabel}</p>;

  // A loading read lists nothing yet, so the title stands alone until the wallets land.
  return (
    <div className="flex flex-col gap-8">
      {rows.map(row => (
        <AssetRow key={row.id} row={row} />
      ))}
    </div>
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
  if (!isVisible) return null;

  return (
    <section aria-label={title} className="flex flex-col gap-12" data-testid="card-assets">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <AssetsBody status={status} rows={rows} emptyLabel={emptyLabel} errorLabel={errorLabel} />
    </section>
  );
}
