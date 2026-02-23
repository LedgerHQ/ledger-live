import { RecentAddress as RecentAddressType } from "@ledgerhq/live-common/flows/send/recipient/types";
import {
  BottomSheetHeader,
  BottomSheetView,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { useRecentAddressDisplay } from "../hooks/useRecentAddressDisplay";
import { AddressListItem } from "./AddressListItem";

type RecentAddressBottomSheetProps = Readonly<{
  selectedRecentAddress: RecentAddressType;
  handleRemoveAddress: (address: string) => void;
}>;

export const RecentAddressBottomSheet = ({
  selectedRecentAddress,
  handleRemoveAddress,
}: RecentAddressBottomSheetProps) => {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      container: {
        marginHorizontal: -theme.spacings.s8,
      },
    }),
    [],
  );
  const { displayName, dateText } = useRecentAddressDisplay(selectedRecentAddress);

  return (
    <BottomSheetView style={styles.container}>
      <BottomSheetHeader />
      <Subheader lx={{ marginBottom: "s12" }}>
        <SubheaderRow lx={{ paddingHorizontal: "s8" }}>
          <SubheaderTitle typography="body2SemiBold">
            {t("send.newSendFlow.recentDetail")}
          </SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <AddressListItem
        address={selectedRecentAddress.address}
        name={displayName}
        description={dateText}
        onSelect={() => handleRemoveAddress(selectedRecentAddress.address)}
        rightIcon={<Trash size={24} />}
        isLedgerAccount={selectedRecentAddress.isLedgerAccount}
      />
    </BottomSheetView>
  );
};
