import React, { useCallback } from "react";
import { View, FlatList, ListRenderItem } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { RecentAddressTile } from "./RecentAddressTile";
import type { RecentAddress } from "../types";

type RecentAddressesSectionProps = Readonly<{
  recentAddresses: RecentAddress[];
  onSelect: (address: RecentAddress) => void;
  onRemove: (address: RecentAddress) => void;
}>;

export function RecentAddressesSection({
  recentAddresses,
  onSelect,
  onRemove,
}: RecentAddressesSectionProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      container: {
        gap: theme.spacings.s12,
      },
      header: {
        paddingHorizontal: theme.spacings.s8,
      },
      listContent: {
        paddingHorizontal: theme.spacings.s8,
        gap: theme.spacings.s8,
      },
    }),
    [],
  );

  const renderItem: ListRenderItem<RecentAddress> = useCallback(
    ({ item }) => (
      <RecentAddressTile
        recentAddress={item}
        onSelect={() => onSelect(item)}
        onRemove={() => onRemove(item)}
      />
    ),
    [onSelect, onRemove],
  );

  const keyExtractor = useCallback((item: RecentAddress) => item.address, []);

  if (recentAddresses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Subheader style={styles.header}>
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.recent")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <FlatList
        data={recentAddresses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
