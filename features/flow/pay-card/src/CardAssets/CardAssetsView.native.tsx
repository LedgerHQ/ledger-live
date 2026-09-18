import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ICON_SIZE = 48;

function AssetRow({ row }: Readonly<{ row: CardAssetRow }>) {
  return (
    <ListItem
      testID={`card-asset-${row.id}`}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
    >
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} shape="circle" />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          {row.countervalue === null ? null : (
            <ListItemTitle testID={`card-asset-countervalue-${row.id}`}>
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
  if (status === "error") {
    return (
      <Text typography="body2" lx={{ color: "muted" }}>
        {errorLabel}
      </Text>
    );
  }

  if (status === "empty") {
    return (
      <Text typography="body2" lx={{ color: "muted" }}>
        {emptyLabel}
      </Text>
    );
  }

  // A loading read lists nothing yet, so the title stands alone until the wallets land.
  return (
    <Box lx={{ gap: "s8" }}>
      {rows.map(row => (
        <AssetRow key={row.id} row={row} />
      ))}
    </Box>
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
    <Box lx={{ gap: "s12" }} testID="card-assets">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <AssetsBody status={status} rows={rows} emptyLabel={emptyLabel} errorLabel={errorLabel} />
    </Box>
  );
}
