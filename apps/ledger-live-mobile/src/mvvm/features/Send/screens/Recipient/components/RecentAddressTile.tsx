import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  Tile,
  TileSpot,
  TileContent,
  TileTitle,
  TileDescription,
} from "@ledgerhq/lumen-ui-rnative";
import { Wallet, LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import type { RecentAddress } from "../types";
import { formatRelativeDate } from "@ledgerhq/live-common/flows/send/recipient/utils/dateFormatter";

type RecentAddressTileProps = Readonly<{
  recentAddress: RecentAddress;
  onSelect: () => void;
  onRemove: () => void;
}>;

export function RecentAddressTile({ recentAddress, onSelect, onRemove }: RecentAddressTileProps) {
  const { t } = useTranslation();

  const Icon = recentAddress.isLedgerAccount ? LedgerLogo : Wallet;

  const displayName = useMemo(
    () => recentAddress.ensName ?? recentAddress.name ?? formatAddress(recentAddress.address),
    [recentAddress.ensName, recentAddress.name, recentAddress.address],
  );

  const dateText = useMemo(
    () => formatRelativeDate(recentAddress.lastUsedAt),
    [recentAddress.lastUsedAt],
  );

  const handleLongPress = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <Tile
      appearance="card"
      onPress={onSelect}
      onLongPress={handleLongPress}
      style={styles.tile}
      accessibilityLabel={t("newSendFlow.recentAddress", { address: displayName })}
      accessibilityHint={t("newSendFlow.longPressToRemove")}
    >
      <TileSpot appearance="icon" icon={Icon} />
      <TileContent>
        <TileTitle>{displayName}</TileTitle>
        <TileDescription>{dateText}</TileDescription>
      </TileContent>
    </Tile>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 96,
  },
});
