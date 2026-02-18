import type { RecentAddress as RecentAddressType } from "@ledgerhq/live-common/flows/send/recipient/types";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "~/context/Locale";
import { RecentAddress } from "./RecentAddress";

type RecentAddressesSectionProps = Readonly<{
  recentAddresses: RecentAddressType[];
  onSelect: (address: RecentAddressType) => void;
  onLongPress: (address: RecentAddressType) => void;
}>;

export const RecentAddressesSection = ({
  recentAddresses,
  onSelect,
  onLongPress,
}: RecentAddressesSectionProps) => {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    () => ({
      recentScrollContent: {
        flexDirection: "row" as const,
      },
    }),
    [],
  );

  return recentAddresses.length > 0 ? (
    <Box lx={{ marginBottom: "s8" }}>
      <Subheader>
        <SubheaderRow lx={{ marginHorizontal: "s8", marginBottom: "s8" }}>
          <SubheaderTitle typography="body4SemiBold">{t("send.newSendFlow.recent")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentScrollContent}
      >
        {recentAddresses.map(recentAddress => (
          <RecentAddress
            key={recentAddress.address}
            recentAddress={recentAddress}
            onSelect={() => onSelect(recentAddress)}
            onLongPress={() => onLongPress(recentAddress)}
          />
        ))}
      </ScrollView>
    </Box>
  ) : null;
};
