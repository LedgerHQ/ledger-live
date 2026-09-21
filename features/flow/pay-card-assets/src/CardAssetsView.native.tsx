import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Skeleton,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { useTranslation } from "@shared/i18n";
import type { CardAssetRow, CardAssetsViewModel } from "./types";

const ICON_SIZE = 48;
const COUNTERVALUE_PLACEHOLDER = "\u00a0";

function AssetRow({
  row,
  onPress,
}: Readonly<{ row: CardAssetRow; onPress: (row: CardAssetRow) => void }>) {
  return (
    <ListItem
      testID={`card-asset-${row.id}`}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      onPress={() => onPress(row)}
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
          <ListItemTitle testID={`card-asset-countervalue-${row.id}`}>
            {row.countervalue ?? COUNTERVALUE_PLACEHOLDER}
          </ListItemTitle>
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
    return (
      <Text typography="body2" lx={{ color: "muted" }}>
        {t("payTab.card.assets.error")}
      </Text>
    );
  }

  if (status === "empty") {
    return (
      <Text typography="body2" lx={{ color: "muted" }}>
        {t("payTab.card.assets.empty")}
      </Text>
    );
  }

  if (status === "loading") {
    return (
      <Box testID="card-assets-loading-state">
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
        <Skeleton component="list-item" />
      </Box>
    );
  }

  return (
    <Box lx={{ gap: "s8" }}>
      {rows.map(row => (
        <AssetRow key={row.id} row={row} onPress={onAssetPress} />
      ))}
    </Box>
  );
}

export function CardAssetsView({ isVisible, status, rows, onAssetPress }: CardAssetsViewModel) {
  const { t } = useTranslation();
  const title = t("payTab.card.assets.title");

  if (!isVisible) return null;

  return (
    <Box lx={{ gap: "s12" }} testID="card-assets">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <AssetsBody status={status} rows={rows} onAssetPress={onAssetPress} />
    </Box>
  );
}
